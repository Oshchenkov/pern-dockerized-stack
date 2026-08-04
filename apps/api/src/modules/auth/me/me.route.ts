import { Router } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { authenticate } from "#src/middleware/auth.middleware";
import { meController } from "./me.controller";

const router: Router = Router();

router.get(
  "/",
  authenticate,
  limiter({ limit: 100 }), // ← inline
  asyncHandler(meController),
);

export default router;
