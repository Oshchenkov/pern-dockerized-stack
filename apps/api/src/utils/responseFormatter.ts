import { Response } from "express";
import { ApiResponse } from "../types";

export const sendResponse = <T = unknown>(
  res: Response,
  statusCode: number,
  data: T,
  message: string | null = null,
): void => {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};
