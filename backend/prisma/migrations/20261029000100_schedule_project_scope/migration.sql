ALTER TABLE "schedule_events" ADD COLUMN "project_id" UUID;

ALTER TABLE "schedule_events"
  ADD CONSTRAINT "schedule_events_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "schedule_events_project_id_deleted_at_idx" ON "schedule_events"("project_id", "deleted_at");
