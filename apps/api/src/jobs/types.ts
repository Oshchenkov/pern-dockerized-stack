/** All queue names in one place. */
export const QUEUE_NAMES = {
  MAINTENANCE: "maintenance",
} as const;

/** Job payload types per queue. */
export interface MaintenanceJobs {
  cleanup: Record<string, never>; // no payload
  "purge-sessions": Record<string, never>;
  "purge-denylist": Record<string, never>;
}
