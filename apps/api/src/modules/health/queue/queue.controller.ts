import { logger } from "#src/config/logger";
import { getMaintenanceQueue } from "#src/jobs/maintenance.queue";
import { Request, Response, NextFunction } from "express";

export async function queueHealthController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const queue = getMaintenanceQueue();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    const schedulers = await queue.getJobSchedulers();
    logger.debug({ first: schedulers[0] }, "Scheduler shape");

    res.sendResponse(
      200,
      {
        queue: "maintenance",
        counts: { waiting, active, completed, failed, delayed },
        schedulers: schedulers.map((s) => ({
          name: s.name,
          pattern: s.pattern,
          template: s.template, // { name, data, opts } — the job it spawns
        })),
      },
      "bullMQ works",
    );
  } catch (err) {
    next(err);
  }
}
