import pino from "pino";
import { env } from "./env";

const pinoLogger = pino({
  level: "error",

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
      "body.token",
      "body.accessToken",
      "body.refreshToken",
    ],
    censor: "[REDACTED]",
  },

  ...(env.isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname,service",
          },
        },
      }
    : {}),
});

export default pinoLogger;
