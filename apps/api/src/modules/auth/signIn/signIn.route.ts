import { Router } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { validate } from "#src/middleware/validate.middleware";
import { signInSchema } from "./signIn.validation";
import { signInController } from "./signIn.controller";

const router: Router = Router();

router.post(
  "/",
  validate({ body: signInSchema }),
  limiter({ limit: 100 }),
  asyncHandler(signInController),
);

export default router;
