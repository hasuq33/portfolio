import { durationToMilliseconds } from '../auth/auth.constants';
import 'dotenv';

export function validateEnvironment(config: Record<string, unknown>) {
  const accessSecret = requiredString(config, 'JWT_ACCESS_SECRET');
  const refreshSecret = requiredString(config, 'JWT_REFRESH_SECRET');
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error(
      'JWT access and refresh secrets must each be at least 32 characters.',
    );
  }
  if (accessSecret === refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.',
    );
  }

  requiredString(config, 'MONGODB_URI');
  requiredString(config, 'ALLOWED_URL');
  for (const [name, fallback] of [
    ['JWT_ACCESS_EXPIRES_IN', '10m'],
    ['JWT_REFRESH_EXPIRES_IN', '12h'],
    ['JWT_REMEMBER_REFRESH_EXPIRES_IN', '30d'],
  ] as const) {
    durationToMilliseconds(String(config[name] ?? fallback));
  }

  const resetMinutes = Number(config.PASSWORD_RESET_EXPIRES_MINUTES ?? 30);
  if (
    !Number.isInteger(resetMinutes) ||
    resetMinutes < 5 ||
    resetMinutes > 1440
  ) {
    throw new Error(
      'PASSWORD_RESET_EXPIRES_MINUTES must be between 5 and 1440.',
    );
  }

  if (config.NODE_ENV === 'production') {
    requiredString(config, 'FRONTEND_URL');
    requiredString(config, 'SMTP_HOST');
    requiredString(config, 'SMTP_USER');
    requiredString(config, 'SMTP_PASSWORD');
    requiredString(config, 'MAIL_FROM');
  }

  return config;
}

function requiredString(config: Record<string, unknown>, name: string) {
  const value = config[name];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}
