const LEVELS = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

function timestamp() {
  return new Date().toISOString();
}

function serializeError(error) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.code ? { code: error.code } : {}),
      ...(error.statusCode ? { statusCode: error.statusCode } : {}),
      ...(error.status ? { status: error.status } : {}),
    };
  }
  return error;
}

function emit(level, message, details = {}) {
  const payload = {
    ts: timestamp(),
    level: LEVELS[level] || level,
    message,
    ...details,
  };

  if (details.error) {
    payload.error = serializeError(details.error);
  }

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

const logger = {
  info(message, details) {
    emit("info", message, details);
  },
  warn(message, details) {
    emit("warn", message, details);
  },
  error(message, details) {
    emit("error", message, details);
  },
};

module.exports = logger;
