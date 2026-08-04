import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.isDevelopment ? "info" : "error",

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
    censor: "[HIDDEN]",
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
