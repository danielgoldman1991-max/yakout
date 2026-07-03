type Level = "debug" | "info" | "warn" | "error";

const PREFIX = "[Yakout]";
const IS_DEV = process.env.NODE_ENV === "development";

function log(level: Level, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `${PREFIX} [${level.toUpperCase()}] ${timestamp}`;

  switch (level) {
    case "debug":
      if (IS_DEV) console.debug(prefix, message, data ?? "");
      break;
    case "info":
      console.info(prefix, message, data ?? "");
      break;
    case "warn":
      console.warn(prefix, message, data ?? "");
      break;
    case "error":
      console.error(prefix, message, data ?? "");
      break;
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => log("debug", message, data),
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
