// utils/errors.ts
import { AppError } from "#src/middleware/error.middleware";

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, msg, details);

export const unauthorized = (msg = "Unauthorized") => new AppError(401, msg);

export const forbidden = (msg = "Forbidden", details?: unknown) =>
  new AppError(403, msg, details);

export const notFoundError = (msg = "Resource not found") =>
  new AppError(404, msg);

export const conflict = (msg: string, details?: unknown) =>
  new AppError(409, msg, details);
