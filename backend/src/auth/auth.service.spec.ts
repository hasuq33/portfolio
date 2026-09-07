import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { GENERIC_PASSWORD_RESET_MESSAGE } from './auth.constants';

const query = <T>(value: T) => ({
  select: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('AuthService', () => {
  const userModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    create: jest.fn(),
  };
  const sessionModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(
      ({ type }: { type: string; jti: string; [key: string]: unknown }) =>
        Promise.resolve(`${type}-token`),
    ),
    verifyAsync: jest.fn(),
  };
  const configValues: Record<string, string> = {
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    JWT_ACCESS_EXPIRES_IN: '10m',
    JWT_REFRESH_EXPIRES_IN: '12h',
    JWT_REMEMBER_REFRESH_EXPIRES_IN: '30d',
    PASSWORD_RESET_EXPIRES_MINUTES: '30',
  };
  const configService = {
    get: jest.fn(
      (name: string, fallback?: string) => configValues[name] ?? fallback,
    ),
    getOrThrow: jest.fn((name: string) => configValues[name]),
  };
  const mailService = { sendPasswordResetEmail: jest.fn() };
  const accessService = {
    resolveUserAccess: jest.fn().mockResolvedValue({
      menuItemIds: [],
      modelAccess: {},
      currentCompanyId: null,
    }),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userModel as never,
      sessionModel as never,
      jwtService as never,
      configService as never,
      mailService as never,
      accessService as never,
    );
  });

  it.each([
    [false, 43_200_000],
    [true, 2_592_000_000],
  ])(
    'keeps access short while rememberMe=%s controls refresh persistence',
    async (rememberMe, expectedRefreshAge) => {
      const user = {
        _id: new Types.ObjectId(),
        login: 'admin',
        email: 'admin@example.com',
        companyIds: [new Types.ObjectId()],
        allowedToAllCompanies: true,
        password: await bcrypt.hash('password123', 4),
        status: 'active',
        authVersion: 0,
      };
      userModel.findOne.mockReturnValue(query(user));
      sessionModel.create.mockResolvedValue({});

      const result = await service.login({
        login: 'admin',
        password: 'password123',
        rememberMe,
      });

      expect(result.accessMaxAgeMs).toBe(600_000);
      expect(result.refreshMaxAgeMs).toBe(expectedRefreshAge);
      expect(result.user).not.toHaveProperty('password');
      expect(sessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe }),
      );
      const [accessPayload, refreshPayload] = jwtService.signAsync.mock.calls
        .slice(-2)
        .map(([payload]) => payload);
      expect(accessPayload.jti).toMatch(/^[a-f0-9]{32}$/);
      expect(refreshPayload.jti).toMatch(/^[a-f0-9]{32}$/);
      expect(accessPayload.jti).not.toBe(refreshPayload.jti);
    },
  );

  it('uses the same generic login failure for missing users and wrong passwords', async () => {
    userModel.findOne.mockReturnValue(query(null));
    await expect(
      service.login({ login: 'missing', password: 'wrong', rememberMe: false }),
    ).rejects.toEqual(new UnauthorizedException('Invalid login credentials.'));
  });

  it('uses the same generic login failure for an existing user with a wrong password', async () => {
    userModel.findOne.mockReturnValue(
      query({
        _id: new Types.ObjectId(),
        password: await bcrypt.hash('correct-password', 4),
        status: 'active',
      }),
    );

    await expect(
      service.login({ login: 'admin', password: 'wrong', rememberMe: false }),
    ).rejects.toEqual(new UnauthorizedException('Invalid login credentials.'));
  });

  it('returns an indistinguishable forgot-password response for missing users', async () => {
    userModel.findOne.mockReturnValue(query(null));
    await expect(
      service.forgotPassword({ email: 'missing@example.com' }),
    ).resolves.toEqual({
      message: GENERIC_PASSWORD_RESET_MESSAGE,
    });
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('stores only a reset-token hash and emails the raw token', async () => {
    const user = {
      _id: new Types.ObjectId(),
      email: 'admin@example.com',
      name: 'Admin',
    };
    userModel.findOne.mockReturnValue(query(user));
    userModel.updateOne.mockReturnValue(query({ modifiedCount: 1 }));
    mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    await expect(
      service.forgotPassword({ email: user.email }),
    ).resolves.toEqual({ message: GENERIC_PASSWORD_RESET_MESSAGE });

    const storedTokenHash = userModel.updateOne.mock.calls[0][1].$set
      .passwordResetTokenHash as string;
    const emailedToken = mailService.sendPasswordResetEmail.mock.calls[0][0]
      .token as string;
    expect(emailedToken).toMatch(/^[a-f0-9]{64}$/);
    expect(storedTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedTokenHash).not.toBe(emailedToken);
  });

  it('rejects password mismatch before signup writes data', async () => {
    await expect(
      service.signup({
        name: 'Admin',
        email: 'admin@example.com',
        login: 'admin',
        password: 'password123',
        confirmPassword: 'different123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('creates signup users from an explicit safe field allowlist', async () => {
    const createdUser = {
      _id: new Types.ObjectId(),
      name: 'Admin',
      email: 'admin@example.com',
      login: 'admin',
      companyIds: [],
      groupIds: [],
      allowedToAllCompanies: false,
      status: 'active',
      isVerified: false,
    };
    userModel.create.mockResolvedValue(createdUser);

    const result = await service.signup({
      name: 'Admin',
      email: 'ADMIN@example.com',
      login: 'ADMIN',
      password: 'password123',
      confirmPassword: 'password123',
      roles: ['admin'],
    } as never);

    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        login: 'admin',
        status: 'active',
        isVerified: false,
        companyIds: [],
        groupIds: [],
        allowedToAllCompanies: false,
      }),
    );
    expect(userModel.create.mock.calls[0][0]).not.toHaveProperty('roles');
    expect(userModel.create.mock.calls[0][0].password).not.toBe('password123');
    expect(result.user).not.toHaveProperty('password');
  });

  it('rotates a valid refresh token atomically', async () => {
    const userId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const user = {
      _id: userId,
      login: 'admin',
      status: 'active',
      authVersion: 0,
    };
    jwtService.verifyAsync.mockResolvedValue({
      sub: String(userId),
      login: 'admin',
      sid: String(sessionId),
      ver: 0,
      jti: 'refresh-id',
      type: 'refresh',
    });
    sessionModel.findOne.mockReturnValue(
      query({ _id: sessionId, userId, rememberMe: false }),
    );
    userModel.findById.mockReturnValue(query(user));
    sessionModel.updateOne.mockReturnValue(query({ modifiedCount: 1 }));

    await expect(service.refresh('previous-refresh-token')).resolves.toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );
    expect(sessionModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: sessionId }),
      expect.objectContaining({
        $set: expect.objectContaining({ tokenHash: expect.any(String) }),
      }),
    );
  });

  it('rejects an expired or revoked refresh session', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: String(new Types.ObjectId()),
      login: 'admin',
      sid: String(new Types.ObjectId()),
      ver: 0,
      jti: 'refresh-id',
      type: 'refresh',
    });
    sessionModel.findOne.mockReturnValue(query(null));

    await expect(service.refresh('expired-refresh-token')).rejects.toThrow(
      'Authentication is required.',
    );
  });

  it('revokes the matching refresh session on logout', async () => {
    sessionModel.deleteOne.mockReturnValue(query({ deletedCount: 1 }));

    await expect(service.logout('raw-refresh-token')).resolves.toEqual({
      message: 'Logged out successfully.',
    });
    expect(sessionModel.deleteOne).toHaveBeenCalledWith({
      tokenHash: expect.not.stringContaining('raw-refresh-token'),
    });
  });

  it('invalidates all refresh sessions after a successful password reset', async () => {
    const user = { _id: new Types.ObjectId() };
    userModel.findOneAndUpdate.mockReturnValue(query(user));
    sessionModel.deleteMany.mockReturnValue(query({ deletedCount: 2 }));

    await expect(
      service.resetPassword({
        token: 'a'.repeat(64),
        password: 'new-password123',
        confirmPassword: 'new-password123',
      }),
    ).resolves.toEqual({ message: 'Password updated successfully.' });
    expect(sessionModel.deleteMany).toHaveBeenCalledWith({ userId: user._id });
  });

  it('rejects an invalid, expired, or already-used reset token', async () => {
    userModel.findOneAndUpdate.mockReturnValue(query(null));
    await expect(
      service.resetPassword({
        token: 'b'.repeat(64),
        password: 'new-password123',
        confirmPassword: 'new-password123',
      }),
    ).rejects.toThrow('This password reset link is invalid or has expired.');
  });
});
