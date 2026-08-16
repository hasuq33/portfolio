import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const accessToken = request.cookies?.[ACCESS_TOKEN_COOKIE] as
      | string
      | undefined;
    if (!accessToken)
      throw new UnauthorizedException('Authentication is required.');

    request.user = await this.authService.authenticateAccessToken(accessToken);
    return true;
  }
}
