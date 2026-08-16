import { emitGlobalError } from "./error-event";
import { AppError } from "./error";

interface FetchOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  payload?: BodyInit;
  headers?: HeadersInit;
  suppressGlobalError?: boolean;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  errors?: Array<{ field?: string; message?: string }>;
}

const publicAuthEndpoints = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
]);

let refreshPromise: Promise<boolean> | null = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  const authPages = ["/web/login", "/web/signup", "/web/forgot-password", "/web/reset-password"];
  if (!authPages.some((path) => window.location.pathname.startsWith(path))) {
    window.location.assign("/web/login");
  }
};

export const apiFetch = async ({
  url,
  method = "GET",
  payload,
  headers,
  suppressGlobalError = false,
}: FetchOptions) => {
  const request = () => fetch(process.env.NEXT_PUBLIC_BACKEND_URL + url, {
    method,
    credentials: "include",
    headers,
    body: payload,
  });

  try {
    let response = await request();

    if (response.status === 401 && !publicAuthEndpoints.has(url)) {
      if (await refreshSession()) {
        response = await request();
      } else {
        redirectToLogin();
      }
    }

    if (!response.ok) {
      let message = "Something went wrong!";
      let title = "Request Failed";

      try {
        const data = await response.clone().json() as ApiErrorResponse;
        title = data.error ?? title;
        const fieldMessages = data.errors
          ?.map((error) => error.message)
          .filter((fieldMessage): fieldMessage is string => Boolean(fieldMessage));
        const responseMessage = Array.isArray(data.message)
          ? data.message.join("\n")
          : data.message;
        message = fieldMessages?.length
          ? fieldMessages.join("\n")
          : responseMessage ?? message;
      } catch {
        // Keep the fallback message when the response is not JSON.
      }

      const error = new AppError(message, response.status, title);
      if (!suppressGlobalError && typeof window !== "undefined") {
        emitGlobalError({
          title: error.title,
          message: error.message,
          status: error.status,
        });
      }
    }

    return response;
  } catch {
    const error = new AppError("Connection Failed", 500, "Network Failed!");
    if (!suppressGlobalError && typeof window !== "undefined") {
      emitGlobalError({
        title: error.title,
        message: error.message,
        status: error.status,
      });
    }
  }
};
