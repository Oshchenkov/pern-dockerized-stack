// src/jobs/maintenance.worker.ts

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES } from "./types";
import { queueConnection } from "#src/config/queue";
import { cleanupService } from "#src/services/cleanup.service";
import { logger } from "#src/config/logger";

let worker: Worker | null = null;

/**
 * v6: Jobs spawned by upsertJobScheduler get IDs like:
 *   "cleanup-every-6h:1754236800000"
 *   "session-purge-hourly:1754215200000"
 *
 * Always match on `job.name` — never on `job.id`.
 */
export function startMaintenanceWorker(): Worker {
  worker = new Worker(
    QUEUE_NAMES.MAINTENANCE,

    async (job: Job) => {
      const start = Date.now();

      logger.debug(
        {
          jobId: job.id ?? "no-id",
          jobName: job.name,
          attempt: job.attemptsMade,
        },
        "Processing job",
      );

      switch (job.name) {
        case "cleanup": {
          const result = await cleanupService.runAll();
          logger.info(
            { ...result, ms: Date.now() - start, jobId: job.id },
            "Full cleanup done",
          );
          break;
        }

        case "purge-sessions": {
          const count = await cleanupService.purgeExpiredSessions();
          logger.info(
            { count, ms: Date.now() - start, jobId: job.id },
            "Session purge done",
          );
          break;
        }

        case "purge-denylist": {
          const count = await cleanupService.purgeExpiredDenylist();
          logger.info(
            { count, ms: Date.now() - start, jobId: job.id },
            "Denylist purge done",
          );
          break;
        }

        default: {
          logger.warn(
            { jobId: job.id, jobName: job.name },
            "Unknown maintenance job — skipping",
          );
        }
      }
    },

    {
      connection: queueConnection,
      concurrency: 1,
      limiter: { max: 1, duration: 60_000 },
    },
  );

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, name: job.name }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        name: job?.name,
        attempt: job?.attemptsMade,
        err: err.message,
      },
      "Job failed",
    );
  });

  worker.on("error", (err) => {
    logger.error({ err }, "Worker connection error");
  });

  worker.on("stalled", (jobId) => {
    logger.warn({ jobId }, "Job stalled — lock expired before completion");
  });

  logger.info("Maintenance worker started");
  return worker;
}

export async function stopMaintenanceWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info("Maintenance worker stopped");
  }
}
