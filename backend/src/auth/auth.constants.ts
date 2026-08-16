export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const PASSWORD_MIN_LENGTH = 8;
export const GENERIC_PASSWORD_RESET_MESSAGE =
  'If an account exists for this email, a password reset link has been sent.';

export function durationToMilliseconds(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration '${value}'. Use values such as 10m, 12h, or 30d.`,
    );
  }

  const amount = Number(match[1]);
  const multipliers = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  } as const;

  return amount * multipliers[match[2] as keyof typeof multipliers];
}
