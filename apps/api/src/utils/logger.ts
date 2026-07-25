type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

const colors: Record<LogLevel, string> = {
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  debug: "\x1b[35m", // magenta
};

const RESET = "\x1b[0m";

const formatEntry = (entry: LogEntry): string => {
  const { level, message, requestId, timestamp, meta } = entry;
  const id = requestId ? `[${requestId}] ` : "";
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `${colors[level]}${level.toUpperCase().padEnd(5)}${RESET} ${timestamp} ${id}${message}${metaStr}`;
};

export const logger = {
  info(
    message: string,
    requestId?: string,
    meta?: Record<string, unknown>,
  ): void {
    console.log(
      formatEntry({
        level: "info",
        message,
        requestId,
        timestamp: new Date().toISOString(),
        meta,
      }),
    );
  },

  warn(
    message: string,
    requestId?: string,
    meta?: Record<string, unknown>,
  ): void {
    console.warn(
      formatEntry({
        level: "warn",
        message,
        requestId,
        timestamp: new Date().toISOString(),
        meta,
      }),
    );
  },

  error(
    message: string,
    requestId?: string,
    meta?: Record<string, unknown>,
  ): void {
    console.error(
      formatEntry({
        level: "error",
        message,
        requestId,
        timestamp: new Date().toISOString(),
        meta,
      }),
    );
  },

  debug(
    message: string,
    requestId?: string,
    meta?: Record<string, unknown>,
  ): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        formatEntry({
          level: "debug",
          message,
          requestId,
          timestamp: new Date().toISOString(),
          meta,
        }),
      );
    }
  },
};
