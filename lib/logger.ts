export type LogLevel = "info" | "warn" | "error";

export type LogDetails = Record<string, unknown>;

const CLIENT_LOGGING_ENABLED = process.env.NODE_ENV !== "production";

const LEVEL_STYLE: Record<LogLevel, string> = {
  info: "color:#1d4ed8;font-weight:600",
  warn: "color:#b45309;font-weight:600",
  error: "color:#b91c1c;font-weight:600",
};

function timestamp() {
  return new Date().toISOString();
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...Object.fromEntries(
        Object.entries(error as unknown as Record<string, unknown>).filter(
          ([key]) => !["name", "message", "stack"].includes(key)
        )
      ),
    };
  }

  return error;
}

function normalizeDetails(details?: LogDetails) {
  if (!details) return undefined;

  const normalized: LogDetails = {};
  for (const [key, value] of Object.entries(details)) {
    normalized[key] =
      key === "error" || value instanceof Error ? serializeError(value) : value;
  }
  return normalized;
}

function emit(level: LogLevel, message: string, details?: LogDetails) {
  if (!CLIENT_LOGGING_ENABLED) return;

  const payload = {
    ts: timestamp(),
    level,
    message,
    ...normalizeDetails(details),
  };

  const prefix = `%c[sawy:${level}]`;
  const args: unknown[] = [prefix, LEVEL_STYLE[level], payload.ts, message];
  if (details && Object.keys(details).length > 0) {
    args.push(normalizeDetails(details));
  }

  if (level === "error") {
    console.error(...args);
    return;
  }

  if (level === "warn") {
    console.warn(...args);
    return;
  }

  console.info(...args);
}

export const logger = {
  info(message: string, details?: LogDetails) {
    emit("info", message, details);
  },
  warn(message: string, details?: LogDetails) {
    emit("warn", message, details);
  },
  error(message: string, details?: LogDetails) {
    emit("error", message, details);
  },
};
