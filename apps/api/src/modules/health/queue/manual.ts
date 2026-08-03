// Admin route — trigger a job immediately outside the schedule

import { getMaintenanceQueue } from "#src/jobs/maintenance.queue";
import { authenticate } from "#src/middleware/auth.middleware";
import { Router } from "express";

const router: Router = Router();
router.post("/admin/cleanup/trigger", authenticate, async (_req, res, next) => {
  try {
    const queue = getMaintenanceQueue();

    // v6: just add a job with the same name the worker expects.
    // No jobId needed — BullMQ generates one.
    const job = await queue.add("cleanup", {});

    res.json({
      message: "Cleanup job dispatched",
      jobId: job.id, // e.g. "a1b2c3d4-..."
    });
  } catch (err) {
    next(err);
  }
});

export default router;
