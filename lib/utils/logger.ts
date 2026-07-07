type Level = "debug" | "info" | "warn" | "error";

const PREFIX = "[Yakout]";
const IS_DEV = process.env.NODE_ENV === "development";

function serializeLogData(data: unknown) {
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
      ...Object.fromEntries(Object.entries(data)),
    };
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const common = ["name", "message", "details", "hint", "code", "status", "statusText"];
    const serialized: Record<string, unknown> = {};

    for (const key of common) {
      if (key in record && record[key] !== undefined) serialized[key] = record[key];
    }

    return Object.keys(serialized).length > 0 ? { ...serialized, ...record } : data;
  }

  return data;
}

function log(level: Level, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `${PREFIX} [${level.toUpperCase()}] ${timestamp}`;
  const payload = serializeLogData(data) ?? "";

  switch (level) {
    case "debug":
      if (IS_DEV) console.debug(prefix, message, payload);
      break;
    case "info":
      console.info(prefix, message, payload);
      break;
    case "warn":
      console.warn(prefix, message, payload);
      break;
    case "error":
      console.error(prefix, message, payload);
      break;
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => log("debug", message, data),
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
