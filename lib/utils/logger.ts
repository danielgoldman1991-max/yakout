type Level = "debug" | "info" | "warn" | "error";

const PREFIX = "[Yakout]";
const IS_DEV = process.env.NODE_ENV === "development";

function log(level: Level, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `${PREFIX} [${level.toUpperCase()}] ${timestamp}`;
  const payload =
    data instanceof Error
      ? { name: data.name, message: data.message, stack: data.stack }
      : data && typeof data === "object" && "message" in data
        ? {
            ...(data as Record<string, unknown>),
            message: String((data as { message?: unknown }).message ?? ""),
          }
        : data;

  switch (level) {
    case "debug":
      if (IS_DEV) console.debug(prefix, message, payload ?? "");
      break;
    case "info":
      console.info(prefix, message, payload ?? "");
      break;
    case "warn":
      console.warn(prefix, message, payload ?? "");
      break;
    case "error":
      console.error(prefix, message, payload ?? "");
      break;
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => log("debug", message, data),
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
