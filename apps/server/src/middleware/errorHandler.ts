import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = { success: false, error: err.message };
    if (err.details !== undefined) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  // PostgreSQL errors
  const pgError = err as { code?: string; detail?: string; constraint?: string };
  if (pgError.code === '23505') {
    res.status(409).json({ success: false, error: 'Duplicate entry', detail: pgError.detail });
    return;
  }
  if (pgError.code === '23503') {
    res.status(400).json({ success: false, error: 'Referenced record not found', detail: pgError.detail });
    return;
  }
  if (pgError.code === '23514') {
    res.status(400).json({ success: false, error: 'Value violates check constraint', detail: pgError.constraint });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
