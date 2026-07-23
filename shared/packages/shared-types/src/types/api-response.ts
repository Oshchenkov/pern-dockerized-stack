export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string | null;
  data: T;
  timestamp: string;
}
