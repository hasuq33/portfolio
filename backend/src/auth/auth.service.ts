import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { HydratedDocument, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { AuthSession } from '../schemas/auth-session.schema';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  GENERIC_PASSWORD_RESET_MESSAGE,
  durationToMilliseconds,
} from './auth.constants';
import { AccessService, EffectiveAccess } from '../access/access.service';

interface AuthTokenPayload {
  sub: string;
  login: string;
  sid: string;
  ver: number;
  jti: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
  rememberMe: boolean;
  user: SafeUser;
}

export interface SafeUser {
  _id: string;
  name?: string;
  login?: string;
  email?: string;
  companyIds: string[];
  groupIds: string[];
  allowedToAllCompanies: boolean;
  status?: 'active' | 'inactive';
  isVerified?: boolean;
  hasAvatar?: boolean;
  updatedAt?: Date;
  access: EffectiveAccess;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly dummyPasswordHash = bcrypt.hash(
    randomBytes(32).toString('hex'),
    10,
  );

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(AuthSession.name)
    private readonly sessionModel: Model<AuthSession>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly accessService: AccessService,
  ) {}

  async signup(data: SignupDto) {
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Validation Error',
        message: 'The submitted data is invalid.',
        errors: [
          {
            field: 'confirmPassword',
            message: 'Passwords do not match.',
          },
        ],
      });
    }

    const user = await this.userModel.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      login: data.login.trim().toLowerCase(),
      companyIds: [],
      groupIds: [],
      allowedToAllCompanies: false,
      password: await bcrypt.hash(data.password, 10),
      status: 'active',
      isVerified: false,
      tags: [],
    });

    return {
      message: 'Account created successfully. You can now log in.',
      user: await this.toSafeUser(user),
    };
  }

  async login(data: LoginDto): Promise<AuthTokens> {
    const identifier = data.login.trim();
    const user = await this.userModel
      .findOne({
        $or: [
          { login: identifier },
          { login: identifier.toLowerCase() },
          { email: identifier.toLowerCase() },
        ],
      })
      .select('+password +authVersion')
      .exec();

    const passwordHash = user?.password ?? (await this.dummyPasswordHash);
    const validPassword = await bcrypt.compare(data.password, passwordHash);
    if (!user || !validPassword || user.status === 'inactive') {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    return this.createSession(user, data.rememberMe ?? false);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyToken(rawRefreshToken, 'refresh');
    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.sessionModel
      .findOne({
        _id: payload.sid,
        userId: payload.sub,
        tokenHash,
        expiresAt: { $gt: new Date() },
      })
      .select('+tokenHash')
      .exec();

    if (!session)
      throw new UnauthorizedException('Authentication is required.');

    const user = await this.userModel
      .findById(payload.sub)
      .select('+authVersion')
      .exec();
    if (
      !user ||
      user.status === 'inactive' ||
      (user.authVersion ?? 0) !== payload.ver
    ) {
      await this.sessionModel.deleteOne({ _id: payload.sid }).exec();
      throw new UnauthorizedException('Authentication is required.');
    }

    const rotated = await this.issueTokens(
      user,
      String(session._id),
      session.rememberMe,
    );
    const refreshExpiresAt = new Date(Date.now() + rotated.refreshMaxAgeMs);
    const rotationResult = await this.sessionModel
      .updateOne(
        { _id: session._id, tokenHash },
        {
          $set: {
            tokenHash: this.hashToken(rotated.refreshToken),
            expiresAt: refreshExpiresAt,
            lastUsedAt: new Date(),
          },
        },
      )
      .exec();

    if (rotationResult.modifiedCount !== 1) {
      throw new UnauthorizedException('Authentication is required.');
    }

    return rotated;
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      await this.sessionModel
        .deleteOne({ tokenHash: this.hashToken(rawRefreshToken) })
        .exec();
    }
    return { message: 'Logged out successfully.' };
  }

  async authenticateAccessToken(rawAccessToken: string) {
    const payload = await this.verifyToken(rawAccessToken, 'access');
    const user = await this.userModel
      .findById(payload.sub)
      .select('+authVersion')
      .exec();

    if (
      !user ||
      user.status === 'inactive' ||
      (user.authVersion ?? 0) !== payload.ver
    ) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return user;
  }

  async getCurrentUser(user: HydratedDocument<User>) {
    return this.toSafeUser(user);
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: data.email }).exec();
    if (!user) return { message: GENERIC_PASSWORD_RESET_MESSAGE };

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresMinutes = this.getResetExpiresMinutes();
    const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);

    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: expiresAt,
          },
        },
      )
      .exec();

    try {
      await this.mailService.sendPasswordResetEmail({
        email: user.email ?? data.email,
        name: user.name,
        token: rawToken,
        expiresMinutes,
      });
    } catch {
      await this.userModel
        .updateOne(
          { _id: user._id, passwordResetTokenHash: tokenHash },
          {
            $unset: {
              passwordResetTokenHash: 1,
              passwordResetExpiresAt: 1,
            },
          },
        )
        .exec();
      this.logger.error('Password-reset email delivery failed.');
    }

    return { message: GENERIC_PASSWORD_RESET_MESSAGE };
  }

  async resetPassword(data: ResetPasswordDto) {
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Validation Error',
        message: 'The submitted data is invalid.',
        errors: [
          {
            field: 'confirmPassword',
            message: 'Passwords do not match.',
          },
        ],
      });
    }

    const tokenHash = this.hashToken(data.token);
    const user = await this.userModel
      .findOneAndUpdate(
        {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { $gt: new Date() },
        },
        {
          $set: { password: await bcrypt.hash(data.password, 10) },
          $unset: {
            passwordResetTokenHash: 1,
            passwordResetExpiresAt: 1,
          },
          $inc: { authVersion: 1 },
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new BadRequestException(
        'This password reset link is invalid or has expired.',
      );
    }

    await this.sessionModel.deleteMany({ userId: user._id }).exec();
    return { message: 'Password updated successfully.' };
  }

  private async createSession(
    user: HydratedDocument<User>,
    rememberMe: boolean,
  ): Promise<AuthTokens> {
    const sessionId = new Types.ObjectId();
    const tokens = await this.issueTokens(
      user,
      sessionId.toHexString(),
      rememberMe,
    );

    await this.sessionModel.create({
      _id: sessionId,
      userId: user._id,
      tokenHash: this.hashToken(tokens.refreshToken),
      expiresAt: new Date(Date.now() + tokens.refreshMaxAgeMs),
      rememberMe,
      lastUsedAt: new Date(),
    });

    return tokens;
  }

  private async issueTokens(
    user: HydratedDocument<User>,
    sessionId: string,
    rememberMe: boolean,
  ): Promise<AuthTokens> {
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '10m',
    );
    const refreshExpiresIn = this.configService.get<string>(
      rememberMe ? 'JWT_REMEMBER_REFRESH_EXPIRES_IN' : 'JWT_REFRESH_EXPIRES_IN',
      rememberMe ? '30d' : '12h',
    );
    const basePayload = {
      sub: String(user._id),
      login: user.login ?? '',
      sid: sessionId,
      ver: user.authVersion ?? 0,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          ...basePayload,
          jti: randomBytes(16).toString('hex'),
          type: 'access',
        } satisfies AuthTokenPayload,
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
        },
      ),
      this.jwtService.signAsync(
        {
          ...basePayload,
          jti: randomBytes(16).toString('hex'),
          type: 'refresh',
        } satisfies AuthTokenPayload,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      accessMaxAgeMs: durationToMilliseconds(accessExpiresIn),
      refreshMaxAgeMs: durationToMilliseconds(refreshExpiresIn),
      rememberMe,
      user: await this.toSafeUser(user),
    };
  }

  private async verifyToken(
    rawToken: string,
    expectedType: AuthTokenPayload['type'],
  ) {
    try {
      const secretName =
        expectedType === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET';
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        rawToken,
        { secret: this.configService.getOrThrow<string>(secretName) },
      );
      if (
        payload.type !== expectedType ||
        !payload.sub ||
        !payload.sid ||
        !payload.jti ||
        typeof payload.ver !== 'number'
      ) {
        throw new Error('Invalid token payload.');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getResetExpiresMinutes() {
    const value = Number(
      this.configService.get<string>('PASSWORD_RESET_EXPIRES_MINUTES') ?? 30,
    );
    if (!Number.isInteger(value) || value < 5 || value > 1440) {
      throw new Error(
        'PASSWORD_RESET_EXPIRES_MINUTES must be between 5 and 1440.',
      );
    }
    return value;
  }

  private async toSafeUser(user: HydratedDocument<User>): Promise<SafeUser> {
    return {
      _id: String(user._id),
      name: user.name,
      login: user.login,
      email: user.email,
      companyIds: (user.companyIds ?? []).map((companyId) => String(companyId)),
      groupIds: (user.groupIds ?? []).map((groupId) => String(groupId)),
      allowedToAllCompanies: user.allowedToAllCompanies ?? false,
      status: user.status,
      isVerified: user.isVerified,
      hasAvatar: user.hasAvatar,
      updatedAt: (user as HydratedDocument<User> & { updatedAt?: Date })
        .updatedAt,
      access: await this.accessService.resolveUserAccess(user),
    };
  }
}
