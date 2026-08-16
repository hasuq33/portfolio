import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../auth.constants';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i, {
    message: 'This password reset link is invalid or has expired.',
  })
  token!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  confirmPassword!: string;
}
