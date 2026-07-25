// src/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { can } from "../services/rebac.service";

export function requirePermission(
  permission: string,
  objectType: string,
  objectIdParam = "id",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth?.sub) {
        return res.status(401).json({ error: "unauthenticated" });
      }

      const objectId = req.params[objectIdParam];

      if (!objectId) {
        return res.status(400).json({ error: "missing_object_id" });
      }

      const allowed = await can(req.auth.sub, permission, objectType, objectId);

      if (!allowed) {
        return res.status(403).json({ error: "forbidden" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/*

app.get(
  "/projects/:id",
  authenticate(),
  requirePermission("read", "project", "id"),
  handler
);

app.put(
  "/projects/:id",
  authenticate(),
  requirePermission("write", "project", "id"),
  handler
);

app.delete(
  "/projects/:id",
  authenticate(),
  requirePermission("delete", "project", "id"),
  handler
);

*/
