import { JwtPayload } from "jsonwebtoken";
import { Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
      requestId: string;
      requestTime: string;
    }

    interface Response {
      sendResponse: <T = unknown>(
        statusCode: number,
        data: T,
        message?: string | null,
      ) => void;
    }
  }
}

// Define the shape of your standardized response
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

export { ApiResponse };
