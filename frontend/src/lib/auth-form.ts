export const AUTH_PASSWORD_MIN_LENGTH = 8;

export interface AuthFieldErrors {
  [field: string]: string;
}

interface AuthErrorResponse {
  message?: string | string[];
  errors?: Array<{ field?: string; message?: string }>;
  fields?: string[];
}

export async function readAuthError(
  response: Response | undefined,
  fallback: string,
): Promise<{ message: string; fields: AuthFieldErrors }> {
  if (!response) return { message: "Unable to connect to the server.", fields: {} };

  try {
    const data = await response.json() as AuthErrorResponse;
    const fields: AuthFieldErrors = {};
    for (const error of data.errors ?? []) {
      if (error.field && error.message && !fields[error.field]) fields[error.field] = error.message;
    }
    const responseMessage = Array.isArray(data.message)
      ? data.message[0]
      : data.message;
    for (const field of data.fields ?? []) {
      fields[field] = responseMessage ?? "This value is already in use.";
    }
    return { message: responseMessage ?? fallback, fields };
  } catch {
    return { message: fallback, fields: {} };
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
