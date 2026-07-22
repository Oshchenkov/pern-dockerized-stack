import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType, ZodError } from "zod";

// ── Types ────────────────────────────────────────────────────────────
interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
  headers?: ZodType;
}

interface FieldError {
  field: string;
  message: string;
  code: string;
}

// ── Format Zod errors → flat list ────────────────────────────────────
const formatErrors = (error: ZodError): FieldError[] =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
    code: issue.code,
  }));

// ── Middleware factory ───────────────────────────────────────────────
export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targets: Array<{ key: keyof ValidationSchemas; source: unknown }> = [
      { key: "body", source: req.body },
      { key: "query", source: req.query },
      { key: "params", source: req.params },
      { key: "headers", source: req.headers },
    ];

    const allErrors: FieldError[] = [];

    for (const { key, source } of targets) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(source);

      if (!result.success) {
        allErrors.push(...formatErrors(result.error));
        continue;
      }

      // Replace raw input with parsed (transformed + stripped) data
      if (key === "body") req.body = result.data;
      if (key === "query") req.query = result.data;
      if (key === "params") req.params = result.data;
      // headers are read-only in practice; skip reassignment
    }

    if (allErrors.length > 0) {
      res.status(422).json({
        success: false,
        message: "Validation failed",
        data: { errors: allErrors },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};
