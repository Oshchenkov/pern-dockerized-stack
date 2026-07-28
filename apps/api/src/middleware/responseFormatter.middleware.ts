import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseFormatter";

export const responseFormatter = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.sendResponse = <T = unknown>(
    statusCode: number,
    data: T,
    message?: string | null,
  ): void => {
    sendResponse<T>(res, statusCode, data, message ?? null);
  };

  next();
};
