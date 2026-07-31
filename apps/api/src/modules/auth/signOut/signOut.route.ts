import { Router } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { signOutController } from "./signOut.controller";

const router: Router = Router();

router.get("/", limiter(), asyncHandler(signOutController));

export default router;
