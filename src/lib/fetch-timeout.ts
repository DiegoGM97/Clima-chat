const DEFAULT_TIMEOUT_ERROR =
  "La solicitud tardo demasiado. Intenta nuevamente.";

export function isAbortTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortTimeoutError(error)) {
      throw new Error(DEFAULT_TIMEOUT_ERROR, { cause: error });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
