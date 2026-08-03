import { Router } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { validate } from "#src/middleware/validate.middleware";
import { signUpSchema } from "./signUp.validation";
import { signUpController } from "./signUp.controller";

const router: Router = Router();

router.post(
  "/",
  validate({ body: signUpSchema }),
  limiter({ limit: 100 }), // ← inline
  asyncHandler(signUpController),
);

export default router;
