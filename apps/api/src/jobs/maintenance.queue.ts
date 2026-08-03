// src/jobs/maintenance.queue.ts

import { Queue } from "bullmq";
import { QUEUE_NAMES } from "./types";
import { queueConnection } from "#src/config/queue";
import { logger } from "#src/config/logger";

let maintenanceQueue: Queue | null = null;

export async function initMaintenanceQueue(): Promise<Queue> {
  maintenanceQueue = new Queue(QUEUE_NAMES.MAINTENANCE, {
    connection: queueConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 10 },
    },
  });

  // ── v6: no jobId in opts — scheduler manages IDs automatically ──
  //    Each run gets an ID like "cleanup-every-6h:1754236800000"

  await maintenanceQueue.upsertJobScheduler(
    "cleanup-every-6h",
    { pattern: "0 */6 * * *" },
    {
      name: "cleanup",
      data: {},
    },
  );

  await maintenanceQueue.upsertJobScheduler(
    "session-purge-hourly",
    { pattern: "0 * * * *" },
    {
      name: "purge-sessions",
      data: {},
    },
  );

  await maintenanceQueue.upsertJobScheduler(
    "denylist-purge-daily",
    { pattern: "0 3 * * *" }, // 3 AM daily
    {
      name: "purge-denylist",
      data: {},
    },
  );

  logger.info("Maintenance queue initialized (BullMQ v6 schedulers)");
  return maintenanceQueue;
}

export function getMaintenanceQueue(): Queue {
  if (!maintenanceQueue) {
    throw new Error("Call initMaintenanceQueue() first");
  }
  return maintenanceQueue;
}

export async function closeMaintenanceQueue(): Promise<void> {
  if (maintenanceQueue) {
    await maintenanceQueue.close();
    maintenanceQueue = null;
    logger.info("Maintenance queue closed");
  }
}
