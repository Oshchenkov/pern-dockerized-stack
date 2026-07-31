import { Router } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { refreshController } from "./refresh.controller";

const router: Router = Router();

router.post("/", limiter(), asyncHandler(refreshController));

export default router;
