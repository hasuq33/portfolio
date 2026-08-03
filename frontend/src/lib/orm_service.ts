import { emitGlobalError } from "./error-event";
import { AppError } from "./error";

interface FetchOptions {
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    payload?: BodyInit;
    headers?: HeadersInit;
}

interface ApiErrorResponse {
    message?: string;
    error?: string;
    errors?: Array<{ field?: string; message?: string }>;
}

export const apiFetch = async ({ url, method = "GET", payload, headers }: FetchOptions) => {
    try {
        const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + url, {
            method,
            credentials: "include",
            headers,
            body: payload,
        });

        if (!response.ok) {
            let message = "Something went wrong!";
            let title = "Request Failed";

            try {
                const data = await response.json() as ApiErrorResponse;
                title = data.error ?? title;

                const fieldMessages = data.errors
                    ?.map((error) => error.message)
                    .filter((fieldMessage): fieldMessage is string => Boolean(fieldMessage));

                message = fieldMessages?.length
                    ? fieldMessages.join("\n")
                    : data.message ?? message;
            } catch {
                // Keep the fallback message when the response is not JSON.
            }

            const error = new AppError(message, response.status, title);

            if (typeof window !== "undefined") {
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

        if (typeof window !== "undefined") {
            emitGlobalError({
                title: error.title,
                message: error.message,
                status: error.status,
            });
        }
    }
};
