import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User, UserSchema } from '../schemas/user.schema';
import { AuthSession, AuthSessionSchema } from '../schemas/auth-session.schema';
import { MailModule } from '../mail/mail.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    AccessModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
    ]),
    JwtModule.register({}),
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
