import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('authentication DTOs', () => {
  it('accepts an explicit boolean remember-me value', async () => {
    const dto = plainToInstance(LoginDto, {
      login: ' admin ',
      password: 'password123',
      rememberMe: true,
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.login).toBe('admin');
  });

  it('rejects a non-boolean remember-me value', async () => {
    const dto = plainToInstance(LoginDto, {
      login: 'admin',
      password: 'password123',
      rememberMe: 'true',
    });
    expect(
      (await validate(dto)).some((error) => error.property === 'rememberMe'),
    ).toBe(true);
  });

  it('rejects weak signup passwords and malformed email', async () => {
    const dto = plainToInstance(SignupDto, {
      name: 'Admin',
      email: 'not-an-email',
      login: 'admin',
      password: 'short',
      confirmPassword: 'short',
    });
    const fields = (await validate(dto)).map((error) => error.property);
    expect(fields).toEqual(
      expect.arrayContaining(['email', 'password', 'confirmPassword']),
    );
  });

  it('only accepts dedicated 64-character reset tokens', async () => {
    const dto = plainToInstance(ResetPasswordDto, {
      token: 'access-jwt-is-not-a-reset-token',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(
      (await validate(dto)).some((error) => error.property === 'token'),
    ).toBe(true);
  });
});
