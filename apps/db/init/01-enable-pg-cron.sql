-- Enable the extension in the database defined by POSTGRES_DB
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Example: Schedule a job to run every minute (for testing)
-- SELECT cron.schedule('test-job', '* * * * *', $$SELECT 1;$$);