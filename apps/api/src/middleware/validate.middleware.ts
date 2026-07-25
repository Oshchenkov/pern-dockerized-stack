// middleware/validate.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { z, ZodError } from "zod";

// ── Types ────────────────────────────────────────────────────────────
type SchemaMap = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
};

interface FieldError {
  field: string;
  message: string;
  code: string;
}

// ── Format errors ────────────────────────────────────────────────────
const formatErrors = (error: ZodError): FieldError[] =>
  error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
    code: issue.code,
  }));

// ── Middleware ───────────────────────────────────────────────────────
export const validate = <T extends SchemaMap>(schemas: T): RequestHandler => {
  const schemaMap = schemas as Record<string, z.ZodTypeAny | undefined>;

  return (req: Request, res: Response, next: NextFunction): void => {
    const allErrors: FieldError[] = [];
    const validated: Record<string, unknown> = {};

    const entries: Array<{ key: string; source: unknown }> = [
      { key: "body", source: req.body },
      { key: "query", source: req.query },
      { key: "params", source: req.params },
    ];

    for (const { key, source } of entries) {
      const schema = schemaMap[key];
      if (!schema) continue;

      const result = schema.safeParse(source);

      if (!result.success) {
        allErrors.push(...formatErrors(result.error));
        continue;
      }

      validated[key] = result.data;
    }

    if (allErrors.length > 0) {
      res.sendResponse(422, { errors: allErrors }, "Validation failed");
      return;
    }

    req.validated = validated;
    next();
  };
};
