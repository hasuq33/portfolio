import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import { User } from '../schemas/user.schema';
import { AuthService, AuthTokens } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';

interface AuthenticatedRequest extends Request {
  user: HydratedDocument<User>;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() data: SignupDto) {
    return this.authService.signup(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.login(data);
    this.setAuthCookies(response, tokens);
    return {
      message: 'Login successful.',
      user: tokens.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;
    if (!refreshToken) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Authentication is required.');
    }

    try {
      const tokens = await this.authService.refresh(refreshToken);
      this.setAuthCookies(response, tokens);
      return { user: tokens.user };
    } catch (error) {
      this.clearAuthCookies(response);
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.forgotPassword(data);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;
    const result = await this.authService.logout(refreshToken);
    this.clearAuthCookies(response);
    return result;
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  getUser(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.user);
  }

  private setAuthCookies(response: Response, tokens: AuthTokens) {
    const baseOptions = this.baseCookieOptions();
    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...baseOptions,
      maxAge: tokens.accessMaxAgeMs,
    });
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseOptions,
      ...(tokens.rememberMe ? { maxAge: tokens.refreshMaxAgeMs } : {}),
    });
  }

  private clearAuthCookies(response: Response) {
    const cookieOptions = this.baseCookieOptions();
    response.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
    response.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
  }

  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }
}
