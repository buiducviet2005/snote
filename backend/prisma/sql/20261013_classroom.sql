-- Apply once to an existing SNOTE database that already has the original tables.
-- New databases can instead use the current Prisma schema during initial setup.
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'TEACHER';

DO $$ BEGIN
  CREATE TYPE "class_member_role" AS ENUM ('CLASS_ADMIN', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "course_classes" (
  "id" UUID NOT NULL,
  "teacher_id" UUID NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "code" VARCHAR(50),
  "term" VARCHAR(100),
  "description" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "course_classes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "course_classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "course_classes_teacher_id_deleted_at_idx" ON "course_classes"("teacher_id", "deleted_at");

CREATE TABLE IF NOT EXISTS "class_members" (
  "class_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "class_member_role" NOT NULL DEFAULT 'STUDENT',
  "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_members_pkey" PRIMARY KEY ("class_id", "user_id"),
  CONSTRAINT "class_members_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "course_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "class_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "class_members_user_id_idx" ON "class_members"("user_id");

CREATE TABLE IF NOT EXISTS "study_groups" (
  "id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "leader_id" UUID NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "study_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "study_groups_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "course_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "study_groups_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "study_groups_class_id_idx" ON "study_groups"("class_id");

CREATE TABLE IF NOT EXISTS "study_group_members" (
  "group_id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "study_group_members_pkey" PRIMARY KEY ("group_id", "user_id"),
  CONSTRAINT "study_group_members_class_id_user_id_key" UNIQUE ("class_id", "user_id"),
  CONSTRAINT "study_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "study_group_members_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "course_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "study_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "study_group_members_user_id_idx" ON "study_group_members"("user_id");

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "class_id" UUID;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "group_id" UUID;
DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "course_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "projects_class_id_group_id_idx" ON "projects"("class_id", "group_id");

CREATE TABLE IF NOT EXISTS "progress_reports" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "submitted_by_id" UUID NOT NULL,
  "progress_percent" INTEGER NOT NULL,
  "summary" TEXT NOT NULL,
  "blockers" TEXT,
  "review_score" INTEGER,
  "review_comment" TEXT,
  "reviewed_by_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "progress_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "progress_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "progress_reports_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "progress_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "progress_reports_percent_check" CHECK ("progress_percent" BETWEEN 0 AND 100),
  CONSTRAINT "progress_reports_score_check" CHECK ("review_score" IS NULL OR "review_score" BETWEEN 0 AND 100)
);
CREATE INDEX IF NOT EXISTS "progress_reports_project_id_created_at_idx" ON "progress_reports"("project_id", "created_at");
