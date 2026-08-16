import { validateEnvironment } from './environment.validation';

const validEnvironment = {
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  ALLOWED_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_EXPIRES_IN: '10m',
  JWT_REFRESH_EXPIRES_IN: '12h',
  JWT_REMEMBER_REFRESH_EXPIRES_IN: '30d',
  PASSWORD_RESET_EXPIRES_MINUTES: '30',
};

describe('validateEnvironment', () => {
  it('accepts a valid development authentication configuration', () => {
    expect(validateEnvironment({ ...validEnvironment })).toEqual(
      validEnvironment,
    );
  });

  it('fails startup when a JWT secret is missing or too short', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_ACCESS_SECRET: '' }),
    ).toThrow('JWT_ACCESS_SECRET is required.');
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_ACCESS_SECRET: 'short' }),
    ).toThrow('at least 32 characters');
  });

  it('requires independent access and refresh secrets', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_REFRESH_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      }),
    ).toThrow('must be different');
  });
});
