-- CreateEnum
CREATE TYPE "workspace_type" AS ENUM ('PERSONAL', 'SUBJECT', 'PROJECT');

-- CreateEnum
CREATE TYPE "workspace_status" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "workspace_role" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "workspace_membership_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "type" "workspace_type" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "owner_id" UUID NOT NULL,
    "status" "workspace_status" NOT NULL DEFAULT 'ACTIVE',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "version" INTEGER NOT NULL DEFAULT 1,
    "subject_id" UUID,
    "project_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "invited_by_id" UUID,
    "role" "workspace_role" NOT NULL DEFAULT 'MEMBER',
    "status" "workspace_membership_status" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "invited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_subject_id_key" ON "workspaces"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_project_id_key" ON "workspaces"("project_id");

-- CreateIndex
CREATE INDEX "workspaces_owner_id_idx" ON "workspaces"("owner_id");

-- CreateIndex
CREATE INDEX "workspaces_type_status_deleted_at_idx" ON "workspaces"("type", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "workspaces_created_at_id_idx" ON "workspaces"("created_at", "id");

-- CreateIndex
CREATE INDEX "workspace_members_user_id_status_idx" ON "workspace_members"("user_id", "status");

-- CreateIndex
CREATE INDEX "workspace_members_workspace_id_status_idx" ON "workspace_members"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "workspace_members_workspace_id_status_joined_at_id_idx" ON "workspace_members"("workspace_id", "status", "joined_at", "id");

-- CreateIndex
CREATE INDEX "workspace_members_invited_by_id_idx" ON "workspace_members"("invited_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- C03 backfill: preserve legacy IDs and do not infer a Task creator from its assignee.
-- Every active user receives exactly one personal workspace.
INSERT INTO "workspaces" (
    "id",
    "type",
    "name",
    "owner_id",
    "status",
    "timezone",
    "version",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    'PERSONAL',
    left(coalesce(nullif(trim("full_name"), ''), "email"), 150),
    "id",
    'ACTIVE',
    coalesce(nullif(trim("timezone"), ''), 'Asia/Ho_Chi_Minh'),
    1,
    now(),
    now()
FROM "users"
WHERE "deleted_at" IS NULL
  AND "status" = 'ACTIVE';

INSERT INTO "workspace_members" (
    "id",
    "workspace_id",
    "user_id",
    "role",
    "status",
    "version",
    "invited_at",
    "joined_at",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "workspace"."id",
    "workspace"."owner_id",
    'OWNER',
    'ACCEPTED',
    1,
    "workspace"."created_at",
    "workspace"."created_at",
    "workspace"."created_at",
    "workspace"."updated_at"
FROM "workspaces" AS "workspace"
WHERE "workspace"."type" = 'PERSONAL';

-- Existing subjects keep their academic ownership and link one-to-one to a workspace.
INSERT INTO "workspaces" (
    "id",
    "type",
    "name",
    "owner_id",
    "status",
    "timezone",
    "version",
    "subject_id",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    'SUBJECT',
    left("subject"."name", 150),
    "subject"."user_id",
    CASE
        WHEN "subject"."status" = 'ARCHIVED' THEN 'ARCHIVED'::"workspace_status"
        ELSE 'ACTIVE'::"workspace_status"
    END,
    coalesce(nullif(trim("user"."timezone"), ''), 'Asia/Ho_Chi_Minh'),
    1,
    "subject"."id",
    "subject"."created_at",
    "subject"."updated_at"
FROM "subjects" AS "subject"
JOIN "users" AS "user" ON "user"."id" = "subject"."user_id"
WHERE "subject"."deleted_at" IS NULL
  AND "user"."deleted_at" IS NULL
  AND "user"."status" = 'ACTIVE';

INSERT INTO "workspace_members" (
    "id",
    "workspace_id",
    "user_id",
    "role",
    "status",
    "version",
    "invited_at",
    "joined_at",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "workspace"."id",
    "workspace"."owner_id",
    'OWNER',
    'ACCEPTED',
    1,
    "workspace"."created_at",
    "workspace"."created_at",
    "workspace"."created_at",
    "workspace"."updated_at"
FROM "workspaces" AS "workspace"
WHERE "workspace"."type" = 'SUBJECT';

-- Project IDs remain unchanged; Workspace.project_id links to the legacy metadata row.
INSERT INTO "workspaces" (
    "id",
    "type",
    "name",
    "owner_id",
    "status",
    "timezone",
    "version",
    "project_id",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    'PROJECT',
    left("project"."name", 150),
    "project"."user_id",
    CASE
        WHEN "project"."status" = 'ARCHIVED' THEN 'ARCHIVED'::"workspace_status"
        ELSE 'ACTIVE'::"workspace_status"
    END,
    coalesce(nullif(trim("user"."timezone"), ''), 'Asia/Ho_Chi_Minh'),
    1,
    "project"."id",
    "project"."created_at",
    "project"."updated_at"
FROM "projects" AS "project"
JOIN "users" AS "user" ON "user"."id" = "project"."user_id"
WHERE "project"."deleted_at" IS NULL
  AND "user"."deleted_at" IS NULL
  AND "user"."status" = 'ACTIVE';

-- Project.user_id is the only defensible owner. Additional legacy OWNER rows become MANAGER.
INSERT INTO "workspace_members" (
    "id",
    "workspace_id",
    "user_id",
    "role",
    "status",
    "version",
    "invited_at",
    "joined_at",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "workspace"."id",
    "workspace"."owner_id",
    'OWNER',
    'ACCEPTED',
    1,
    "workspace"."created_at",
    "workspace"."created_at",
    "workspace"."created_at",
    "workspace"."updated_at"
FROM "workspaces" AS "workspace"
WHERE "workspace"."type" = 'PROJECT';

INSERT INTO "workspace_members" (
    "id",
    "workspace_id",
    "user_id",
    "invited_by_id",
    "role",
    "status",
    "version",
    "invited_at",
    "joined_at",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "workspace"."id",
    "member"."user_id",
    "workspace"."owner_id",
    CASE
        WHEN "member"."role" IN ('OWNER', 'ADMIN') THEN 'MANAGER'::"workspace_role"
        WHEN "member"."role" = 'MEMBER' THEN 'MEMBER'::"workspace_role"
        ELSE 'VIEWER'::"workspace_role"
    END,
    CASE
        WHEN "member"."status" = 'PENDING' THEN 'PENDING'::"workspace_membership_status"
        WHEN "member"."status" = 'DECLINED' THEN 'DECLINED'::"workspace_membership_status"
        ELSE 'ACCEPTED'::"workspace_membership_status"
    END,
    1,
    now(),
    CASE WHEN "member"."status" = 'ACCEPTED' THEN "member"."joined_at" ELSE NULL END,
    now(),
    now()
FROM "workspaces" AS "workspace"
JOIN "project_members" AS "member" ON "member"."project_id" = "workspace"."project_id"
WHERE "workspace"."type" = 'PROJECT'
  AND "member"."user_id" <> "workspace"."owner_id";

-- Database-level invariants that Prisma cannot express as partial indexes or CHECK constraints.
CREATE UNIQUE INDEX "workspaces_personal_owner_unique"
ON "workspaces" ("owner_id")
WHERE "type" = 'PERSONAL' AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "workspace_members_single_owner_unique"
ON "workspace_members" ("workspace_id")
WHERE "role" = 'OWNER' AND "status" = 'ACCEPTED';

ALTER TABLE "workspaces"
ADD CONSTRAINT "workspaces_link_matches_type_check"
CHECK (
    ("type" = 'PERSONAL' AND "subject_id" IS NULL AND "project_id" IS NULL)
    OR ("type" = 'SUBJECT' AND "subject_id" IS NOT NULL AND "project_id" IS NULL)
    OR ("type" = 'PROJECT' AND "subject_id" IS NULL AND "project_id" IS NOT NULL)
);

ALTER TABLE "workspace_members"
ADD CONSTRAINT "workspace_members_owner_is_accepted_check"
CHECK ("role" <> 'OWNER' OR "status" = 'ACCEPTED');

ALTER TABLE "workspace_members"
ADD CONSTRAINT "workspace_members_accepted_has_joined_at_check"
CHECK ("status" <> 'ACCEPTED' OR "joined_at" IS NOT NULL);
