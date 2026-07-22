import { z } from "zod";

// Extract the inferred type from a schema map
type InferBody<T> = T extends z.ZodSchema ? z.infer<T> : never;
type InferQuery<T> = T extends z.ZodSchema ? z.infer<T> : never;
type InferParams<T> = T extends z.ZodSchema ? z.infer<T> : never;

export { InferBody, InferQuery, InferParams };
