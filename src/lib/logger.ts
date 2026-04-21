type LogLevel = "error" | "warn" | "info";

function formatMessage(scope: string, message: string) {
  return `[${scope}] ${message}`;
}

export function logMessage(level: LogLevel, scope: string, message: string) {
  const formatted = formatMessage(scope, message);

  if (level === "error") {
    console.error(formatted);
    return;
  }

  if (level === "warn") {
    console.warn(formatted);
    return;
  }

  console.info(formatted);
}

export function logError(scope: string, message: string, error: unknown) {
  const formatted = formatMessage(scope, message);
  console.error(formatted, error);
}
