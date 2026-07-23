import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId: string;
      requestTime: string;
      validated?: Record<string, unknown>;
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
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin" | "moderator";
}
