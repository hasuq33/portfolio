import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthTokens } from './auth.service';

describe('AuthController cookies', () => {
  const authService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };
  const configService = { get: jest.fn(() => 'development') };
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
  const baseTokens: AuthTokens = {
    accessToken: 'short-access-token',
    refreshToken: 'refresh-token',
    accessMaxAgeMs: 600_000,
    refreshMaxAgeMs: 43_200_000,
    rememberMe: false,
    user: {
      _id: 'user-id',
      name: 'Admin',
      login: 'admin',
      email: 'admin@example.com',
      companyIds: ['company-id'],
      groupIds: ['group-id'],
      allowedToAllCompanies: true,
      status: 'active',
      isVerified: false,
      hasAvatar: false,
      updatedAt: undefined,
      access: {
        menuItemIds: ['users'],
        modelAccess: {},
        currentCompanyId: null,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses a browser-session refresh cookie when Remember Me is off', async () => {
    authService.login.mockResolvedValue(baseTokens);
    const controller = new AuthController(
      authService as never,
      configService as never,
    );

    await controller.login(
      { login: 'admin', password: 'password123', rememberMe: false },
      response,
    );

    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      'refresh_token',
      'refresh-token',
      expect.not.objectContaining({ maxAge: expect.any(Number) }),
    );
  });

  it('uses a persistent refresh cookie when Remember Me is on', async () => {
    authService.login.mockResolvedValue({
      ...baseTokens,
      rememberMe: true,
      refreshMaxAgeMs: 2_592_000_000,
    });
    const controller = new AuthController(
      authService as never,
      configService as never,
    );

    await controller.login(
      { login: 'admin', password: 'password123', rememberMe: true },
      response,
    );

    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      'refresh_token',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 2_592_000_000,
      }),
    );
  });

  it('clears stale cookies when refresh authentication fails', async () => {
    authService.refresh.mockRejectedValue(
      new UnauthorizedException('Authentication is required.'),
    );
    const controller = new AuthController(
      authService as never,
      configService as never,
    );

    await expect(
      controller.refresh(
        { cookies: { refresh_token: 'expired-token' } } as Request,
        response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(response.clearCookie).toHaveBeenCalledTimes(2);
  });
});
