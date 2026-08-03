import { Router, Request, Response } from "express";
import { asyncHandler } from "#src/utils/asyncHandler";
import { queueHealthController } from "./queue/queue.controller";

const router: Router = Router();

router.get("/", (req, res) => {
  res.sendResponse(200, { status: "ok" }, "Api works");
});

router.get("/queue", asyncHandler(queueHealthController));

export default router;
