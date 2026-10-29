ALTER TABLE "workspaces" ADD COLUMN "group_id" UUID;
CREATE UNIQUE INDEX "workspaces_group_id_key" ON "workspaces"("group_id");
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notes" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "tasks" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "schedule_events" ADD COLUMN "workspace_id" UUID;

ALTER TABLE "notes" ADD CONSTRAINT "notes_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "notes_workspace_id_deleted_at_idx" ON "notes"("workspace_id", "deleted_at");
CREATE INDEX "tasks_workspace_id_deleted_at_idx" ON "tasks"("workspace_id", "deleted_at");
CREATE INDEX "schedule_events_workspace_id_deleted_at_idx" ON "schedule_events"("workspace_id", "deleted_at");

INSERT INTO "workspaces" ("id", "type", "name", "owner_id", "group_id", "created_at", "updated_at")
SELECT gen_random_uuid(), 'GROUP', g."name", g."leader_id", g."id", g."created_at", CURRENT_TIMESTAMP
FROM "study_groups" g
WHERE NOT EXISTS (SELECT 1 FROM "workspaces" w WHERE w."group_id" = g."id");

INSERT INTO "workspace_members" ("id", "workspace_id", "user_id", "role", "status", "joined_at", "updated_at")
SELECT gen_random_uuid(), w."id", gm."user_id",
  CASE WHEN gm."user_id" = g."leader_id" THEN 'OWNER'::"workspace_role" ELSE 'MEMBER'::"workspace_role" END,
  'ACCEPTED', gm."joined_at", CURRENT_TIMESTAMP
FROM "study_group_members" gm
JOIN "study_groups" g ON g."id" = gm."group_id"
JOIN "workspaces" w ON w."group_id" = g."id"
ON CONFLICT ("workspace_id", "user_id") DO NOTHING;

UPDATE "notes" n SET "workspace_id" = w."id"
FROM "workspaces" w WHERE n."workspace_id" IS NULL AND w."project_id" = n."project_id";
UPDATE "notes" n SET "workspace_id" = w."id"
FROM "workspaces" w WHERE n."workspace_id" IS NULL AND n."project_id" IS NULL AND w."subject_id" = n."subject_id";
UPDATE "notes" n SET "workspace_id" = w."id"
FROM "workspaces" w WHERE n."workspace_id" IS NULL AND n."project_id" IS NULL AND n."subject_id" IS NULL
  AND w."type" = 'PERSONAL' AND w."owner_id" = n."user_id";

UPDATE "tasks" t SET "workspace_id" = w."id"
FROM "workspaces" w WHERE t."workspace_id" IS NULL AND w."project_id" = t."project_id";
UPDATE "tasks" t SET "workspace_id" = w."id"
FROM "workspaces" w WHERE t."workspace_id" IS NULL AND t."project_id" IS NULL AND w."subject_id" = t."subject_id";
UPDATE "tasks" t SET "workspace_id" = w."id"
FROM "workspaces" w WHERE t."workspace_id" IS NULL AND t."project_id" IS NULL AND t."subject_id" IS NULL
  AND w."type" = 'PERSONAL' AND w."owner_id" = t."user_id";

UPDATE "schedule_events" e SET "workspace_id" = w."id"
FROM "workspaces" w WHERE e."workspace_id" IS NULL AND w."project_id" = e."project_id";
UPDATE "schedule_events" e SET "workspace_id" = w."id"
FROM "workspaces" w WHERE e."workspace_id" IS NULL AND e."project_id" IS NULL AND w."subject_id" = e."subject_id";
UPDATE "schedule_events" e SET "workspace_id" = w."id"
FROM "workspaces" w WHERE e."workspace_id" IS NULL AND e."project_id" IS NULL AND e."subject_id" IS NULL
  AND w."type" = 'PERSONAL' AND w."owner_id" = e."user_id";
