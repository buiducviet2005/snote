<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# thực hiện bước 2 AI_NOTE_FLOW_V1

Bắt đầu **Bước 2 – Thiết kế mô hình dữ liệu \& schema** cho `AI_NOTE_FLOW_V1`. Dưới đây là bản thiết kế logic làm nền cho PostgreSQL, bám theo trục **Học kỳ → Môn học/Dự án → Notes \& Tasks**, đồng thời bảo đảm ownership theo người dùng.[^1_1][^1_2]

## 1. Quy ước thiết kế

- CSDL mục tiêu: PostgreSQL.
- Mỗi bảng nghiệp vụ có `id` UUID, `created_at`, `updated_at`.
- Dữ liệu riêng tư luôn truy vết được về `user_id`.
- Thời điểm lưu theo `timestamptz`; hiển thị quy đổi theo timezone hồ sơ người dùng.
- Xóa mềm áp dụng cho `notes`, `tasks`, `subjects`, `projects` bằng `deleted_at`; dữ liệu không bị mất ngay khi người dùng xóa.
- Một note/task phải có ít nhất một ngữ cảnh: `subject_id` hoặc `project_id`. Đây là ràng buộc chống “note rác”.[^1_2]


## 2. Thực thể chính

| Nhóm | Bảng | Vai trò |
| :-- | :-- | :-- |
| Tài khoản | `users` | Chủ sở hữu dữ liệu, cài đặt timezone và hồ sơ |
| Học tập | `semesters` | Học kỳ của một người dùng |
| Học tập | `subjects` | Môn học thuộc một học kỳ |
| Đồ án | `projects` | Dự án/đồ án thuộc một học kỳ, có thể gắn môn |
| Ghi chú | `notes` | Nội dung bài giảng, tài liệu, ôn thi, ý tưởng |
| Công việc | `tasks` | Bài tập, việc ôn tập, việc đồ án có deadline |
| Phân loại | `tags` | Tag do người dùng tự tạo |
| Phân loại | `note_tags`, `task_tags` | Quan hệ nhiều-nhiều giữa note/task và tag |
| Liên kết | `task_note_links` | Liên kết task với note nguồn hoặc tài liệu liên quan |
| Lịch | `schedule_events` | Buổi học, kỳ thi, mốc lịch không nhất thiết là task |
| Tệp | `attachments` | Metadata tệp đính kèm của note/task/project |
| Chia sẻ | `project_members`, `shares` | Thành viên dự án và chia sẻ tài nguyên |
| Sao lưu | `backup_records` | Lịch sử export/backup để theo dõi và khôi phục |

## 3. Quan hệ ERD logic

```text
users
 ├── semesters
 │    ├── subjects
 │    │    ├── notes
 │    │    └── tasks
 │    └── projects
 │         ├── notes
 │         ├── tasks
 │         └── project_members ── users
 │
 ├── tags
 │    ├── note_tags ── notes
 │    └── task_tags ── tasks
 │
 ├── schedule_events
 ├── attachments
 ├── shares
 └── backup_records

notes ── task_note_links ── tasks
```

Quy tắc quan hệ chính:

- `users 1–n semesters`, `users 1–n tags`, `users 1–n notes`, `users 1–n tasks`.
- `semesters 1–n subjects` và `semesters 1–n projects`.
- `subjects 1–n notes/tasks`; `projects 1–n notes/tasks`.
- Một project có thể tùy chọn thuộc một subject, nhưng không bắt buộc.
- Note và task có thể thuộc đồng thời một môn và một dự án, ví dụ task “Hoàn thiện báo cáo đồ án CSDL” thuộc môn CSDL và project đồ án CSDL.
- Tag là riêng theo người dùng trong MVP; chưa dùng tag toàn cục.[^1_2]


## 4. Enum và trạng thái

```text
user_status:
ACTIVE | SUSPENDED | DELETED

semester_status:
PLANNED | ACTIVE | COMPLETED | ARCHIVED

note_type:
LECTURE | ASSIGNMENT | EXAM_REVIEW | RESOURCE | IDEA

task_status:
TODO | IN_PROGRESS | DONE

task_priority:
LOW | MEDIUM | HIGH

project_status:
PLANNED | ACTIVE | ON_HOLD | COMPLETED | ARCHIVED

event_type:
CLASS | EXAM | STUDY_SESSION | DEADLINE | OTHER

share_permission:
VIEWER | EDITOR

attachment_owner_type:
NOTE | TASK | PROJECT

backup_format:
JSON | MARKDOWN | ZIP
```

Các giá trị `note_type`, `task_status` và `task_priority` được giữ đúng với phạm vi sản phẩm đã chốt ở Bước 1.[^1_2]

## 5. Schema logic chi tiết

### `users`

```text
id                  UUID PK
email               VARCHAR(255) UNIQUE NOT NULL
password_hash       TEXT NOT NULL
display_name        VARCHAR(120) NOT NULL
timezone            VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh'
status              user_status NOT NULL DEFAULT ACTIVE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```


### `semesters`

```text
id                  UUID PK
user_id             UUID FK → users.id NOT NULL
name                VARCHAR(120) NOT NULL
code                VARCHAR(50) NULL
start_date          DATE NOT NULL
end_date            DATE NOT NULL
status              semester_status NOT NULL DEFAULT PLANNED
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
archived_at         TIMESTAMPTZ NULL
```

Ràng buộc: `end_date >= start_date`; tên học kỳ là duy nhất trong phạm vi một người dùng.

### `subjects`

```text
id                  UUID PK
user_id             UUID FK → users.id NOT NULL
semester_id         UUID FK → semesters.id NOT NULL
name                VARCHAR(160) NOT NULL
code                VARCHAR(50) NULL
description         TEXT NULL
color               VARCHAR(7) NULL
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

Ràng buộc: `UNIQUE (user_id, semester_id, name)`.

### `projects`

```text
id                  UUID PK
user_id             UUID FK → users.id NOT NULL
semester_id         UUID FK → semesters.id NOT NULL
subject_id          UUID FK → subjects.id NULL
name                VARCHAR(160) NOT NULL
description         TEXT NULL
status              project_status NOT NULL DEFAULT PLANNED
start_date          DATE NULL
due_at              TIMESTAMPTZ NULL
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```


### `notes`

```text
id                  UUID PK
user_id             UUID FK → users.id NOT NULL
semester_id         UUID FK → semesters.id NOT NULL
subject_id          UUID FK → subjects.id NULL
project_id          UUID FK → projects.id NULL
title               VARCHAR(250) NOT NULL
content             TEXT NOT NULL DEFAULT ''
note_type           note_type NOT NULL
is_pinned           BOOLEAN NOT NULL DEFAULT FALSE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

Ràng buộc trọng tâm:

```text
subject_id IS NOT NULL OR project_id IS NOT NULL
```


### `tasks`

```text
id                  UUID PK
user_id             UUID FK → users.id NOT NULL
semester_id         UUID FK → semesters.id NOT NULL
subject_id          UUID FK → subjects.id NULL
project_id          UUID FK → projects.id NULL
title               VARCHAR(250) NOT NULL
description         TEXT NULL
status              task_status NOT NULL DEFAULT TODO
priority            task_priority NOT NULL DEFAULT MEDIUM
due_at              TIMESTAMPTZ NULL
completed_at        TIMESTAMPTZ NULL
estimated_minutes   INTEGER NULL
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

Ràng buộc:

```text
subject_id IS NOT NULL OR project_id IS NOT NULL
estimated_minutes IS NULL OR estimated_minutes > 0
completed_at IS NULL OR status = DONE
```


### `tags`, `note_tags`, `task_tags`

```text
tags
- id UUID PK
- user_id UUID FK → users.id NOT NULL
- name VARCHAR(80) NOT NULL
- color VARCHAR(7) NULL
- created_at TIMESTAMPTZ NOT NULL
- updated_at TIMESTAMPTZ NOT NULL
- UNIQUE(user_id, lower(name))

note_tags
- note_id UUID FK → notes.id
- tag_id UUID FK → tags.id
- created_at TIMESTAMPTZ NOT NULL
- PRIMARY KEY(note_id, tag_id)

task_tags
- task_id UUID FK → tasks.id
- tag_id UUID FK → tags.id
- created_at TIMESTAMPTZ NOT NULL
- PRIMARY KEY(task_id, tag_id)
```


### `task_note_links`

```text
task_id             UUID FK → tasks.id
note_id             UUID FK → notes.id
relation_type       VARCHAR(30) NOT NULL DEFAULT 'REFERENCE'
created_at          TIMESTAMPTZ NOT NULL
PRIMARY KEY(task_id, note_id)
```

Bảng này hỗ trợ use case tạo task từ note nhưng vẫn cho phép một task tham chiếu nhiều note.[^1_2]

### `schedule_events`

```text
id                  UUID PK
user_id             UUID FK → users.id NOT NULL
semester_id         UUID FK → semesters.id NULL
subject_id          UUID FK → subjects.id NULL
project_id          UUID FK → projects.id NULL
task_id             UUID FK → tasks.id NULL
title               VARCHAR(250) NOT NULL
description         TEXT NULL
event_type          event_type NOT NULL
starts_at           TIMESTAMPTZ NOT NULL
ends_at             TIMESTAMPTZ NULL
all_day             BOOLEAN NOT NULL DEFAULT FALSE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULL
```

`tasks.due_at` vẫn là nguồn chính cho deadline; `schedule_events` lưu các sự kiện lịch độc lập như buổi học hoặc ngày thi.

## 6. Chính sách khóa ngoại

| Quan hệ | Chính sách |
| :-- | :-- |
| `users → semesters/subjects/projects/notes/tasks/tags` | `RESTRICT` khi xóa vật lý; xóa tài khoản thực hiện qua quy trình riêng |
| `semesters → subjects/projects` | `RESTRICT` để tránh mất dữ liệu học tập ngoài ý muốn |
| `subjects/projects → notes/tasks` | `SET NULL`, nhưng ứng dụng chỉ cho phép khi note/task còn ngữ cảnh còn lại |
| `notes/tasks → note_tags/task_tags/task_note_links` | `CASCADE` |
| `tags → note_tags/task_tags` | `CASCADE` |
| `projects → project_members` | `CASCADE` |
| `notes/tasks/projects → attachments` | `CASCADE` |
| `tasks → schedule_events` | `SET NULL` để giữ lịch sử sự kiện nếu task bị xóa mềm |

## 7. Index và tìm kiếm

Các index ưu tiên cho MVP:

```text
semesters(user_id, status)
subjects(user_id, semester_id) WHERE deleted_at IS NULL
projects(user_id, semester_id, status) WHERE deleted_at IS NULL

notes(user_id, semester_id, updated_at DESC) WHERE deleted_at IS NULL
notes(user_id, subject_id, note_type) WHERE deleted_at IS NULL
notes(user_id, project_id) WHERE deleted_at IS NULL

tasks(user_id, status, due_at ASC) WHERE deleted_at IS NULL
tasks(user_id, semester_id, status) WHERE deleted_at IS NULL
tasks(user_id, subject_id, priority, due_at ASC) WHERE deleted_at IS NULL
tasks(user_id, project_id, status) WHERE deleted_at IS NULL

note_tags(tag_id, note_id)
task_tags(tag_id, task_id)
schedule_events(user_id, starts_at ASC) WHERE deleted_at IS NULL
```

Để search nhanh, tạo cột `search_vector` cho `notes` từ `title + content`, và cho `tasks` từ `title + description`; sau đó dùng GIN index. Bộ lọc theo môn, tag, trạng thái, ưu tiên và thời gian xử lý bằng index B-tree như trên. Điều này trực tiếp hỗ trợ mục tiêu tìm lại ghi chú nhanh theo môn/tag.[^1_2]

## 8. Tiêu chí hoàn thành Bước 2

Bước 2 được đánh dấu hoàn thành khi có các đầu ra sau:

- ERD chính thức, thể hiện đủ các bảng lõi và quan hệ.
- Data dictionary gồm kiểu dữ liệu, trường bắt buộc, default, constraint và mô tả nghiệp vụ.
- Danh sách enum/CHECK constraint được chốt.
- Chính sách `ON DELETE`, soft-delete và ownership `user_id` được chốt.
- Kế hoạch index, full-text search và các query chính được xác định.
- DDL PostgreSQL đầu tiên có thể được tạo ở **Bước 4** từ thiết kế này.[^1_1]

**Trạng thái:** Bước 2 đã có bản thiết kế schema logic v1, sẵn sàng chuyển sang tạo ERD trực quan và DDL/migration PostgreSQL.

<div align="center">⁂</div>

[^1_1]: chat/tôi muốn tiến trình được chia thành các bước lớn,.md

[^1_2]: đánh dấu các bước/Bước 1 – Định nghĩa sản phẩm \& phạm vi cho AI Note.md


---

# so sánh nó với CREATE TYPE "user_status" AS ENUM (

'active',
'suspended',
'deleted'
);

CREATE TYPE "semester_status" AS ENUM (
'planned',
'active',
'completed',
'archived'
);

CREATE TYPE "subject_status" AS ENUM (
'active',
'completed',
'archived'
);

CREATE TYPE "project_status" AS ENUM (
'planned',
'active',
'completed',
'archived'
);

CREATE TYPE "note_type" AS ENUM (
'lecture',
'reading',
'idea',
'assignment',
'exam_review',
'experience',
'general'
);

CREATE TYPE "note_visibility" AS ENUM (
'private',
'shared',
'public'
);

CREATE TYPE "task_status" AS ENUM (
'not_started',
'in_progress',
'completed',
'cancelled'
);

CREATE TYPE "task_priority" AS ENUM (
'low',
'medium',
'high',
'urgent'
);

CREATE TYPE "schedule_type" AS ENUM (
'class',
'exam',
'assignment',
'study',
'meeting',
'other'
);

CREATE TYPE "share_permission" AS ENUM (
'view',
'comment',
'edit',
'admin'
);

CREATE TYPE "backup_type" AS ENUM (
'markdown',
'json',
'pdf',
'full_backup'
);

CREATE TYPE "backup_scope" AS ENUM (
'all',
'semester',
'subject',
'project',
'collection'
);

CREATE TYPE "backup_status" AS ENUM (
'pending',
'processing',
'completed',
'failed'
);

CREATE TABLE "users" (
"id" uuid PRIMARY KEY NOT NULL,
"email" varchar(255) UNIQUE NOT NULL,
"password_hash" text NOT NULL,
"full_name" varchar(150) NOT NULL,
"avatar_url" text,
"timezone" varchar(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
"status" user_status NOT NULL DEFAULT 'active',
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now()),
"deleted_at" timestamp
);

CREATE TABLE "semesters" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"name" varchar(100) NOT NULL,
"academic_year" varchar(20),
"start_date" date,
"end_date" date,
"status" semester_status NOT NULL DEFAULT 'planned',
"is_current" boolean NOT NULL DEFAULT false,
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "subjects" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"semester_id" uuid,
"code" varchar(50),
"name" varchar(200) NOT NULL,
"description" text,
"credits" smallint,
"color" varchar(20),
"status" subject_status NOT NULL DEFAULT 'active',
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "projects" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"semester_id" uuid,
"subject_id" uuid,
"name" varchar(200) NOT NULL,
"description" text,
"status" project_status NOT NULL DEFAULT 'planned',
"start_date" date,
"due_date" date,
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "notes" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"semester_id" uuid,
"subject_id" uuid,
"project_id" uuid,
"collection_id" uuid,
"title" varchar(300) NOT NULL,
"content" text NOT NULL,
"content_format" varchar(30) NOT NULL DEFAULT 'markdown',
"note_type" note_type NOT NULL DEFAULT 'general',
"is_pinned" boolean NOT NULL DEFAULT false,
"is_archived" boolean NOT NULL DEFAULT false,
"visibility" note_visibility NOT NULL DEFAULT 'private',
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now()),
"deleted_at" timestamp
);

CREATE TABLE "tasks" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"semester_id" uuid,
"subject_id" uuid,
"project_id" uuid,
"parent_task_id" uuid,
"title" varchar(300) NOT NULL,
"description" text,
"status" task_status NOT NULL DEFAULT 'not_started',
"priority" task_priority NOT NULL DEFAULT 'medium',
"due_at" timestamp,
"completed_at" timestamp,
"estimated_minutes" integer,
"actual_minutes" integer,
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now()),
"deleted_at" timestamp
);

CREATE TABLE "schedules" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"semester_id" uuid,
"subject_id" uuid,
"project_id" uuid,
"title" varchar(300) NOT NULL,
"event_type" schedule_type NOT NULL DEFAULT 'study',
"start_at" timestamp NOT NULL,
"end_at" timestamp NOT NULL,
"location" varchar(255),
"description" text,
"repeat_rule" text,
"color" varchar(20),
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "tags" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"name" varchar(100) NOT NULL,
"color" varchar(20),
"created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "note_tags" (
"note_id" uuid NOT NULL,
"tag_id" uuid NOT NULL,
"created_at" timestamp NOT NULL DEFAULT (now()),
PRIMARY KEY ("note_id", "tag_id")
);

CREATE TABLE "task_tags" (
"task_id" uuid NOT NULL,
"tag_id" uuid NOT NULL,
"created_at" timestamp NOT NULL DEFAULT (now()),
PRIMARY KEY ("task_id", "tag_id")
);

CREATE TABLE "attachments" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"note_id" uuid,
"task_id" uuid,
"project_id" uuid,
"collection_id" uuid,
"file_name" varchar(255) NOT NULL,
"storage_key" text NOT NULL,
"mime_type" varchar(100),
"file_size" bigint,
"checksum" varchar(128),
"created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "collections" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"parent_collection_id" uuid,
"name" varchar(200) NOT NULL,
"description" text,
"color" varchar(20),
"icon" varchar(50),
"is_archived" boolean NOT NULL DEFAULT false,
"created_at" timestamp NOT NULL DEFAULT (now()),
"updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "shares" (
"id" uuid PRIMARY KEY NOT NULL,
"owner_id" uuid NOT NULL,
"shared_with_user_id" uuid NOT NULL,
"note_id" uuid,
"task_id" uuid,
"project_id" uuid,
"subject_id" uuid,
"collection_id" uuid,
"permission" share_permission NOT NULL DEFAULT 'view',
"created_at" timestamp NOT NULL DEFAULT (now()),
"expires_at" timestamp
);

CREATE TABLE "backups" (
"id" uuid PRIMARY KEY NOT NULL,
"user_id" uuid NOT NULL,
"backup_type" backup_type NOT NULL,
"scope_type" backup_scope NOT NULL,
"scope_id" uuid,
"file_name" varchar(255) NOT NULL,
"storage_key" text NOT NULL,
"file_size" bigint,
"checksum" varchar(128),
"status" backup_status NOT NULL DEFAULT 'pending',
"created_at" timestamp NOT NULL DEFAULT (now()),
"completed_at" timestamp,
"error_message" text
);

CREATE UNIQUE INDEX ON "users" ("email");

CREATE INDEX ON "users" ("status");

CREATE INDEX ON "semesters" ("user_id", "start_date");

CREATE INDEX ON "semesters" ("user_id", "is_current");

CREATE INDEX ON "subjects" ("user_id", "name");

CREATE INDEX ON "subjects" ("semester_id");

CREATE INDEX ON "subjects" ("code");

CREATE INDEX ON "projects" ("user_id", "status");

CREATE INDEX ON "projects" ("subject_id");

CREATE INDEX ON "projects" ("due_date");

CREATE INDEX ON "notes" ("user_id", "updated_at");

CREATE INDEX ON "notes" ("user_id", "note_type");

CREATE INDEX ON "notes" ("subject_id");

CREATE INDEX ON "notes" ("semester_id");

CREATE INDEX ON "notes" ("project_id");

CREATE INDEX ON "notes" ("collection_id");

CREATE INDEX ON "notes" ("visibility");

CREATE INDEX ON "tasks" ("user_id", "due_at");

CREATE INDEX ON "tasks" ("user_id", "status");

CREATE INDEX ON "tasks" ("user_id", "priority");

CREATE INDEX ON "tasks" ("subject_id", "status");

CREATE INDEX ON "tasks" ("project_id");

CREATE INDEX ON "tasks" ("parent_task_id");

CREATE INDEX ON "schedules" ("user_id", "start_at", "end_at");

CREATE INDEX ON "schedules" ("subject_id");

CREATE INDEX ON "schedules" ("project_id");

CREATE INDEX ON "schedules" ("event_type");

CREATE UNIQUE INDEX ON "tags" ("user_id", "name");

CREATE INDEX ON "note_tags" ("tag_id");

CREATE INDEX ON "task_tags" ("tag_id");

CREATE INDEX ON "attachments" ("user_id", "created_at");

CREATE INDEX ON "attachments" ("note_id");

CREATE INDEX ON "attachments" ("task_id");

CREATE INDEX ON "attachments" ("project_id");

CREATE INDEX ON "attachments" ("collection_id");

CREATE INDEX ON "collections" ("user_id", "name");

CREATE INDEX ON "collections" ("parent_collection_id");

CREATE INDEX ON "shares" ("owner_id", "created_at");

CREATE INDEX ON "shares" ("shared_with_user_id");

CREATE INDEX ON "shares" ("note_id");

CREATE INDEX ON "shares" ("task_id");

CREATE INDEX ON "shares" ("project_id");

CREATE INDEX ON "shares" ("subject_id");

CREATE INDEX ON "shares" ("collection_id");

CREATE INDEX ON "backups" ("user_id", "created_at");

CREATE INDEX ON "backups" ("status");

CREATE INDEX ON "backups" ("scope_type");

COMMENT ON TABLE "users" IS 'Tài khoản sinh viên';

COMMENT ON TABLE "semesters" IS 'Học kỳ của sinh viên';

COMMENT ON TABLE "subjects" IS 'Môn học';

COMMENT ON TABLE "projects" IS 'Đồ án hoặc dự án';

COMMENT ON TABLE "notes" IS 'Ghi chú bài giảng, tài liệu hoặc ý tưởng';

COMMENT ON TABLE "tasks" IS 'Công việc, bài tập hoặc việc cần làm';

COMMENT ON TABLE "schedules" IS 'Lịch học, lịch thi hoặc sự kiện';

COMMENT ON TABLE "tags" IS 'Nhãn phân loại';

COMMENT ON TABLE "note_tags" IS 'Quan hệ nhiều-nhiều giữa ghi chú và tag';

COMMENT ON TABLE "task_tags" IS 'Quan hệ nhiều-nhiều giữa task và tag';

COMMENT ON TABLE "attachments" IS 'Tệp đính kèm';

COMMENT ON TABLE "collections" IS 'Nhóm ghi chú hoặc tài liệu';

COMMENT ON TABLE "shares" IS 'Chia sẻ dữ liệu cho người khác';

COMMENT ON TABLE "backups" IS 'Thông tin sao lưu hoặc xuất dữ liệu';

ALTER TABLE "semesters" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "subjects" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "subjects" ADD FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects" ADD FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects" ADD FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notes" ADD FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notes" ADD FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notes" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notes" ADD FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("parent_task_id") REFERENCES "tasks" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "schedules" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "schedules" ADD FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "schedules" ADD FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "schedules" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tags" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "note_tags" ADD FOREIGN KEY ("note_id") REFERENCES "notes" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "note_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "task_tags" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "task_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attachments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attachments" ADD FOREIGN KEY ("note_id") REFERENCES "notes" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attachments" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attachments" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "attachments" ADD FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "collections" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "collections" ADD FOREIGN KEY ("parent_collection_id") REFERENCES "collections" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("shared_with_user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("note_id") REFERENCES "notes" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shares" ADD FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "backups" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

đánh giá mức độ chi tiết và sai phạm

Schema bạn đưa có mức độ chi tiết **cao hơn bản schema logic Bước 2**: đã gần mức DDL/migration cho Bước 4, bao phủ cả collections, chia sẻ, tệp đính kèm và backup. Tuy nhiên, nó còn một số lỗi toàn vẹn dữ liệu quan trọng và vài phần vượt phạm vi MVP cần điều chỉnh trước khi dùng làm migration chính thức.[^2_1][^2_2]

## Đánh giá tổng quan

| Tiêu chí | Đánh giá | Nhận xét |
| :-- | --: | :-- |
| Độ đầy đủ thực thể | 9/10 | Có đủ lõi: user, học kỳ, môn, project, note, task, lịch, tag, tệp, chia sẻ, backup; thêm `collections` và task cha-con |
| Bám sát AI Note | 8/10 | Phù hợp triết lý Học kỳ/Môn học/Dự án + Tag, nhưng chưa ép note/task phải có context học tập |
| Chuẩn hóa | 8/10 | Quan hệ n-n tag tốt; attachment và share dùng nhiều FK nullable nên cần CHECK |
| Toàn vẹn dữ liệu | 5/10 | Thiếu nhiều `CHECK`, thiếu xác thực ownership giữa các bảng, và có FK `SET NULL` không phù hợp với định hướng dữ liệu |
| Khả năng mở rộng | 8/10 | Có nền tốt cho sharing, backup và collection, nhưng đang hơi “đón đầu” so với MVP |
| Search hiệu quả | 5/10 | Có index lọc, nhưng chưa có full-text search/GIN cho `notes.content` và `tasks.description` |
| Sẵn sàng migration | 7/10 | Cú pháp tổng thể khả dụng, nhưng nên sửa các ràng buộc trước khi chạy production |

## Điểm tốt hơn bản Bước 2

Schema của bạn bổ sung nhiều khả năng thực tế mà bản Bước 2 mới chỉ mô tả logic:

- `collections` hỗ trợ phân nhóm ghi chú/tài liệu ngoài trục môn học và dự án.
- `parent_task_id` cho phép chia task lớn thành subtasks.
- `actual_minutes` cho phép theo dõi thời gian thực tế, hữu ích cho báo cáo tiến độ sau này.
- `note_visibility`, `share_permission`, `expires_at` chuẩn bị tốt cho cộng tác.
- `attachments` có `storage_key`, `mime_type`, `file_size`, `checksum`, phù hợp với lưu file ngoài database.
- `backups` có trạng thái xử lý, checksum và phạm vi export; đây là thiết kế tốt nếu export chạy background.
- Enum `note_type` phong phú hơn, có `reading`, `experience`, `general`; hợp với mục tiêu lưu tài liệu và kinh nghiệm học tập.[^2_2]


## Sai phạm và lỗi quan trọng

### 1. Note/task không bị bắt buộc gắn ngữ cảnh

Đây là sai lệch lớn nhất với triết lý chống “note rác”. Hiện tại cả `notes` lẫn `tasks` đều cho phép `semester_id`, `subject_id`, `project_id`, `collection_id` cùng bằng `NULL`. Kết quả là có thể sinh note/task rời rạc, khó tìm lại. Trong tài liệu Bước 1, note và task phải thuộc ít nhất một ngữ cảnh là môn học hoặc dự án trong học kỳ.[^2_2]

Thêm tối thiểu:

```sql
ALTER TABLE notes
ADD CONSTRAINT chk_notes_learning_context
CHECK (subject_id IS NOT NULL OR project_id IS NOT NULL);

ALTER TABLE tasks
ADD CONSTRAINT chk_tasks_learning_context
CHECK (subject_id IS NOT NULL OR project_id IS NOT NULL);
```

Nếu bạn muốn cho phép “inbox note” rời rạc, cần thiết kế rõ bằng một trạng thái riêng, ví dụ `inbox`, thay vì vô tình để mọi khóa ngoại nullable.

### 2. Thiếu ràng buộc ownership xuyên bảng

Các FK chỉ xác nhận ID có tồn tại, nhưng không xác nhận chúng thuộc **cùng người dùng**.

Ví dụ, về mặt dữ liệu hiện tại, note của user A có thể gắn `subject_id` của user B nếu backend có lỗi hoặc API bị khai thác. Điều này cũng xảy ra với `notes`, `tasks`, `projects`, `schedules`, `attachments`, `shares`, `note_tags`, và `task_tags`.

Ví dụ rủi ro:

```text
notes.user_id = user_A
notes.subject_id = subject_của_user_B
```

FK vẫn hợp lệ, nhưng vi phạm riêng tư và ownership.

Cách xử lý tốt nhất:

- Dùng khóa duy nhất ghép: `UNIQUE (id, user_id)` ở các bảng tài nguyên.
- Dùng FK ghép `(subject_id, user_id) → subjects(id, user_id)`.
- Làm tương tự cho semester, project, note, task, tag và collection.
- Hoặc dùng trigger kiểm tra ownership nếu ORM/migration không tiện triển khai FK ghép.

Đây là yêu cầu quan trọng vì Project AI Note đặt dữ liệu cá nhân và tách riêng tư theo `user_id` làm nguyên tắc cốt lõi.[^2_1][^2_2]

### 3. `shares` có thể không có hoặc có nhiều target

Bảng `shares` cho phép toàn bộ các cột:

```text
note_id, task_id, project_id, subject_id, collection_id
```

đều `NULL`, hoặc cùng lúc có nhiều giá trị. Nghĩa là một record share có thể không chia sẻ gì, hoặc không rõ đang chia sẻ loại tài nguyên nào.

Thêm CHECK “đúng một target”:

```sql
ALTER TABLE shares
ADD CONSTRAINT chk_shares_exactly_one_target
CHECK (
  num_nonnulls(note_id, task_id, project_id, subject_id, collection_id) = 1
);
```

Ngoài ra cần tránh việc tự chia sẻ cho chính mình:

```sql
ALTER TABLE shares
ADD CONSTRAINT chk_shares_not_self
CHECK (owner_id <> shared_with_user_id);
```

Nên bổ sung unique để tránh share trùng:

```sql
CREATE UNIQUE INDEX uq_shares_unique_target_recipient
ON shares (
  owner_id,
  shared_with_user_id,
  COALESCE(note_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(task_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(subject_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(collection_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
```


### 4. `attachments` có cùng lỗi đa mục tiêu

Một attachment hiện có thể không thuộc tài nguyên nào, hoặc đồng thời thuộc note + task + project + collection. Điều này gây mơ hồ cho API, xóa dữ liệu và phân quyền.

```sql
ALTER TABLE attachments
ADD CONSTRAINT chk_attachments_exactly_one_owner
CHECK (
  num_nonnulls(note_id, task_id, project_id, collection_id) = 1
);
```

Hoặc thiết kế sạch hơn là dùng mô hình polymorphic:

```text
owner_type: NOTE | TASK | PROJECT | COLLECTION
owner_id: UUID
```

Tuy nhiên, PostgreSQL không thể tạo FK chuẩn cho polymorphic `owner_id`; với MVP, nhiều FK nullable + `num_nonnulls(...) = 1` là lựa chọn an toàn và dễ kiểm soát hơn.

### 5. Dùng `timestamp` thay vì `timestamptz`

Các cột thời gian như `due_at`, `start_at`, `end_at`, `created_at`, `updated_at`, `completed_at`, `expires_at` đều đang là `timestamp` không timezone.

Vì sản phẩm có `users.timezone`, nên nên dùng:

```sql
TIMESTAMPTZ NOT NULL DEFAULT now()
```

đặc biệt cho deadline, lịch học/lịch thi, lịch sử cập nhật và export. Nếu dùng `timestamp`, 8:00 tại Hà Nội và 8:00 ở múi giờ khác bị lưu như cùng một giá trị, làm sync đa thiết bị khó chính xác.

Riêng `start_date`, `end_date`, `due_date` chỉ biểu diễn ngày thì dùng `DATE` là đúng.

### 6. `updated_at` không tự cập nhật

`DEFAULT now()` chỉ chạy lúc `INSERT`, không tự thay đổi khi `UPDATE`. Mọi bảng có `updated_at` cần trigger dùng chung:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Sau đó tạo trigger `BEFORE UPDATE` cho: `users`, `semesters`, `subjects`, `projects`, `notes`, `tasks`, `schedules`, `collections` và `tags`.

### 7. Thiếu CHECK cho dữ liệu thời gian và số lượng

Các ràng buộc cần bổ sung:

```sql
ALTER TABLE semesters
ADD CONSTRAINT chk_semester_dates
CHECK (
  start_date IS NULL
  OR end_date IS NULL
  OR end_date >= start_date
);

ALTER TABLE projects
ADD CONSTRAINT chk_project_dates
CHECK (
  start_date IS NULL
  OR due_date IS NULL
  OR due_date >= start_date
);

ALTER TABLE schedules
ADD CONSTRAINT chk_schedule_time_range
CHECK (end_at > start_at);

ALTER TABLE tasks
ADD CONSTRAINT chk_task_estimated_minutes
CHECK (estimated_minutes IS NULL OR estimated_minutes > 0);

ALTER TABLE tasks
ADD CONSTRAINT chk_task_actual_minutes
CHECK (actual_minutes IS NULL OR actual_minutes >= 0);

ALTER TABLE tasks
ADD CONSTRAINT chk_task_completion_state
CHECK (
  (status = 'completed' AND completed_at IS NOT NULL)
  OR (status <> 'completed' AND completed_at IS NULL)
);

ALTER TABLE attachments
ADD CONSTRAINT chk_attachment_file_size
CHECK (file_size IS NULL OR file_size >= 0);

ALTER TABLE subjects
ADD CONSTRAINT chk_subject_credits
CHECK (credits IS NULL OR credits > 0);
```


### 8. `semester_id` nullable ở `subjects` và `projects`

Thiết kế Bước 1 xác định học kỳ là trục tổ chức chính; môn học và đồ án đều tạo trong học kỳ. Vì vậy:

```sql
subjects.semester_id
projects.semester_id
```

nên là `NOT NULL`, không nên `ON DELETE SET NULL`.[^2_2]

Khuyến nghị:

```text
subjects.semester_id: NOT NULL, ON DELETE RESTRICT
projects.semester_id: NOT NULL, ON DELETE RESTRICT
```

Nếu muốn archive/xóa một học kỳ, hãy archive trước, hoặc có một hành động xóa theo cascade có xác nhận rõ ràng; không nên biến tài nguyên thành “mất học kỳ”.

### 9. Thiếu bảng hoặc quan hệ cộng tác dự án

Schema có `shares`, nhưng chưa có `project_members`. Điều này chưa đáp ứng tốt use case nhóm đồ án: ai là thành viên, vai trò gì, khi nào tham gia, task nào giao cho ai. Bước 1 mô tả đồ án nhóm và board chia sẻ cho các thành viên.[^2_2]

Nên bổ sung tối thiểu:

```sql
CREATE TYPE project_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
```

Khi có bảng này, việc “task được giao cho thành viên” cũng cần thêm:

```text
tasks.assignee_user_id UUID NULL
```

với FK đến `users`, kèm rule rằng assignee phải là project member nếu task thuộc project.

### 10. Search chưa đáp ứng yêu cầu

Schema hiện mới có index lọc (`user_id`, `subject_id`, `note_type`...), chưa có index tìm kiếm nội dung. Trong yêu cầu Bước 2, notes/tasks cần full-text search để tìm theo nội dung text.[^2_1]

Nên bổ sung:

```sql
ALTER TABLE notes
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'simple',
    coalesce(title, '') || ' ' || coalesce(content, '')
  )
) STORED;

CREATE INDEX idx_notes_search_vector
ON notes USING GIN (search_vector)
WHERE deleted_at IS NULL;
```

Tương tự cho `tasks(title, description)`. Với tiếng Việt, PostgreSQL có thể dùng cấu hình `simple` kết hợp unaccent, hoặc triển khai search service ở tầng ứng dụng sau; nhưng GIN vẫn là nền tốt.

## Sai lệch phạm vi MVP

Một số phần hợp lý về dài hạn nhưng có thể tăng độ phức tạp nếu đưa ngay vào MVP:


| Thành phần | Nhận định | Khuyến nghị |
| :-- | :-- | :-- |
| `collections` lồng nhau | Hữu ích nhưng tạo thêm trục tổ chức song song với Học kỳ/Môn học/Dự án | Giữ ở phase 2 hoặc giới hạn collection phẳng |
| `public` visibility | Cần chính sách khám phá, URL, chống lộ dữ liệu và kiểm duyệt | MVP chỉ nên có `private` và chia sẻ theo người dùng |
| Quyền `comment`, `admin` | `comment` cần comment table; `admin` chưa có ý nghĩa rõ với một resource | MVP dùng `view`, `edit`; `admin` dành cho project |
| `repeat_rule` | Cần chuẩn recurrence như iCalendar RRULE và logic sinh occurrence | Để phase lịch nâng cao |
| `backup_type = pdf` | Charter MVP chỉ yêu cầu Markdown và JSON | Có thể để future scope |
| `urgent`, `cancelled` | Hợp lý, không gây phức tạp đáng kể | Có thể giữ nếu UI có quy tắc rõ |
| `reading`, `experience`, `general` | Hợp với mục tiêu second brain | Nên giữ |
| Subtask | Có ích nhưng task tree kéo theo query/progress phức tạp | Giữ nhưng giới hạn cấp sâu hoặc dời phase 2 |

Những mở rộng này không “sai”, nhưng cần được ghi rõ là **future-ready fields**, không nên làm chậm luồng note/task/lịch cốt lõi của MVP. Phạm vi MVP đã ưu tiên sự đơn giản, ổn định và cấu trúc Học kỳ/Môn học/Dự án.[^2_2]

## Điều chỉnh ưu tiên

Trước khi chốt schema này làm bản DDL v1, ưu tiên theo thứ tự:

1. Chuyển toàn bộ instant time từ `timestamp` sang `timestamptz`.
2. Ép note/task phải có `subject_id` hoặc `project_id`.
3. Đặt `subjects.semester_id` và `projects.semester_id` là `NOT NULL`.
4. Thêm CHECK cho share, attachment, ngày tháng, khoảng thời gian, số phút và trạng thái hoàn thành.
5. Bổ sung kiểm soát ownership xuyên bảng bằng composite FK hoặc trigger.
6. Thêm trigger tự cập nhật `updated_at`.
7. Xác định rõ hoặc thêm `project_members` và cơ chế giao task cho nhóm.
8. Bổ sung GIN full-text index cho notes/tasks.
9. Loại bớt hoặc tạm hoãn `public`, `comment`, `admin`, recurring schedule và PDF export nếu mục tiêu là MVP nhanh.

## Kết luận

Bạn đang có một bản schema **rất tốt về độ bao phủ**, khoảng **80% sẵn sàng** để trở thành database design v1. Nó chi tiết hơn bản Bước 2 ở tầng triển khai, nhưng chưa đủ an toàn để chạy production do thiếu các CHECK và quy tắc ownership then chốt.

Sau khi xử lý 9 ưu tiên trên, schema có thể được chốt là đầu ra chính thức của **Bước 2 – Thiết kế mô hình dữ liệu \& schema**, rồi chuyển sang Bước 3 hoặc viết migration có kiểm thử ở Bước 4.[^2_1][^2_2]

<div align="center">⁂</div>

[^2_1]: chat/tôi muốn tiến trình được chia thành các bước lớn,.md

[^2_2]: đánh dấu các bước/Bước 1 – Định nghĩa sản phẩm \& phạm vi cho AI Note.md


---

# học hỏi lẫn nhau và đửa ra phiên bản hoàn chỉnh nhất cho bước 2, hoàn thiện bước 2

Phiên bản Bước 2 có thể coi là **hoàn chỉnh v1** nếu bạn giữ toàn bộ schema hiện tại làm nền, rồi bổ sung thêm lớp ràng buộc và chuẩn hóa dưới đây. Bản này hợp nhất triết lý Học kỳ/Môn học/Dự án + Tag từ charter với DDL bạn đã viết, và xử lý các sai lệch đã chỉ ra.[^3_1][^3_2]

## Định hướng chung cho schema Bước 2

- Trục tổ chức chính vẫn là: **Người dùng → Học kỳ → Môn học/Dự án → Notes/Tasks**, Tag là lớp bổ sung, không thay thế trục này.[^3_1]
- Mọi `note` và `task` đều thuộc **một người dùng** và phải gắn ít nhất **một ngữ cảnh học tập** (môn học hoặc dự án), để tránh “note rác” khó tìm lại.[^3_1]
- Non‑AI core phải ưu tiên tính ổn định, bảo toàn dữ liệu và khả năng backup/export; các bảng `shares`, `collections`, `attachments`, `backups` mở đường cho cộng tác và xuất dữ liệu về sau.[^3_2][^3_1]


## Enum / TYPE cuối cùng

Giữ gần như toàn bộ enum bạn đã định nghĩa, vì chúng đã bao phủ tốt các trạng thái cần cho MVP, chỉ cần thống nhất là chúng là **truth source** cho logic ứng dụng:

- `user_status`: `active`, `suspended`, `deleted`.
- `semester_status`: `planned`, `active`, `completed`, `archived`.
- `subject_status`: `active`, `completed`, `archived`.
- `project_status`: `planned`, `active`, `completed`, `archived`.
- `note_type`: `lecture`, `reading`, `idea`, `assignment`, `exam_review`, `experience`, `general`.
- `note_visibility`: `private`, `shared`, `public` (MVP có thể dùng chủ yếu `private`, `shared`).
- `task_status`: `not_started`, `in_progress`, `completed`, `cancelled`.
- `task_priority`: `low`, `medium`, `high`, `urgent`.
- `schedule_type`: `class`, `exam`, `assignment`, `study`, `meeting`, `other`.
- `share_permission`: `view`, `comment`, `edit`, `admin` (MVP dùng chủ yếu `view`, `edit`).
- `backup_type`: `markdown`, `json`, `pdf`, `full_backup` (MVP chắc chắn cần `markdown`, `json`).
- `backup_scope`: `all`, `semester`, `subject`, `project`, `collection`.
- `backup_status`: `pending`, `processing`, `completed`, `failed`.

Các TYPE này bám đúng yêu cầu Bước 1 về loại note, trạng thái task, ưu tiên và phân loại backup/export.[^3_1]

## Bảng lõi và những điểm giữ nguyên

Nhìn chung, **cấu trúc bảng bạn đã viết là đúng hướng và đầy đủ**, nên được giữ làm nền:

- `users`: tài khoản sinh viên; giữ các trường `email`, `password_hash`, `full_name`, `avatar_url`, `timezone`, `status`, dấu thời gian.
- `semesters`: học kỳ của sinh viên, có `academic_year`, `is_current`, ngày bắt đầu/kết thúc và trạng thái.
- `subjects`: môn học, gắn `user_id`, `semester_id`, có `code`, `name`, `credits`, `color`, `status`.
- `projects`: đồ án/dự án, gắn `user_id`, `semester_id`, `subject_id`, tên, mô tả, trạng thái, ngày bắt đầu/kết thúc.
- `notes`: ghi chú, gắn `user_id`, `semester_id`, `subject_id`, `project_id`, `collection_id`, `note_type`, `visibility`, pin/archived.
- `tasks`: công việc/bài tập, gắn `user_id`, `semester_id`, `subject_id`, `project_id`, `parent_task_id`, trạng thái, ưu tiên, deadline, thời lượng ước tính/thực tế.
- `schedules`: lịch sự kiện học tập, gắn `user_id`, `semester_id`, `subject_id`, `project_id`, thời gian bắt đầu/kết thúc, loại sự kiện, location, repeat rule.
- `tags`, `note_tags`, `task_tags`: hệ thống tag và quan hệ n‑n đúng chuẩn.
- `attachments`: tệp đính kèm cho note/task/project/collection, có `storage_key`, `mime_type`, `file_size`, `checksum`.
- `collections`: nhóm ghi chú/tài liệu, hỗ trợ phân nhóm flex hơn trục Học kỳ/Môn học/Dự án.
- `shares`: chia sẻ note/task/project/subject/collection cho người khác với quyền cụ thể.
- `backups`: log các lần backup/export với loại, phạm vi, file, trạng thái và lỗi nếu có.

Ở mức “thực thể + cột chính”, schema này đã đáp ứng đầy đủ danh sách thực thể và nhiệm vụ Bước 2 được nêu trong tài liệu bước lớn.[^3_2]

## Các điều chỉnh bắt buộc để hoàn chỉnh Bước 2

Để schema đạt mức “hoàn chỉnh v1”, cần bổ sung thêm **lớp ràng buộc dữ liệu và toàn vẹn ownership** sau. Đây là phần chính mà chúng ta đã học hỏi và tinh chỉnh từ bản DDL đầu tiên.

### 1. Ép note/task luôn có ngữ cảnh học tập

Thêm CHECK cho `notes` và `tasks` để đảm bảo không có ghi chú/công việc hoàn toàn “trôi nổi”:

```sql
ALTER TABLE "notes"
ADD CONSTRAINT "chk_notes_learning_context"
CHECK ("subject_id" IS NOT NULL OR "project_id" IS NOT NULL);

ALTER TABLE "tasks"
ADD CONSTRAINT "chk_tasks_learning_context"
CHECK ("subject_id" IS NOT NULL OR "project_id" IS NOT NULL);
```

Điều này bám đúng triết lý chống “note rác” của sản phẩm: mọi ghi chú/công việc phải được gắn với ít nhất môn học hoặc dự án trong một học kỳ.[^3_1]

### 2. Ràng buộc ownership theo user_id xuyên bảng

Hiện tại FK chỉ đảm bảo ID tồn tại, chưa đảm bảo các tài nguyên thuộc **cùng một user**. Để tránh case `notes.user_id = A` nhưng `notes.subject_id` trỏ sang subject của user B, nên:

- Thêm `UNIQUE (id, user_id)` cho các bảng `semesters`, `subjects`, `projects`, `notes`, `tasks`, `tags`, `collections`.
- Đổi FK thành dạng composite, ví dụ:

```sql
ALTER TABLE "subjects"
ADD CONSTRAINT "uq_subject_id_user"
UNIQUE ("id", "user_id");

ALTER TABLE "notes"
ADD CONSTRAINT "fk_notes_subject_user"
FOREIGN KEY ("subject_id", "user_id")
REFERENCES "subjects" ("id", "user_id")
DEFERRABLE INITIALLY IMMEDIATE;
```

Nếu việc dùng FK ghép phức tạp với ORM, có thể dùng trigger `BEFORE INSERT/UPDATE` để kiểm tra `user_id` của resource con luôn trùng với `user_id` của resource cha (subject, project, collection...). Điều này rất quan trọng để đảm bảo dữ liệu cá nhân không bị “cross‑user”.[^3_1]

### 3. Bắt buộc `semester_id` cho `subjects` và `projects`

Trong thiết kế sản phẩm, **học kỳ là trục tổ chức chính**; môn học và dự án đều là “con” của học kỳ. Vì vậy nên:

- Đặt `semester_id` ở `subjects` và `projects` thành `NOT NULL`.
- Đổi FK từ `ON DELETE SET NULL` sang `ON DELETE RESTRICT` hoặc chỉ cho phép xóa học kỳ khi đã archive và người dùng xác nhận xóa toàn bộ dữ liệu liên quan.

Điều này giữ cho dữ liệu luôn nằm trong một học kỳ cụ thể, đúng với cấu trúc đã chốt ở Bước 1.[^3_1]

### 4. Ràng buộc một mục tiêu duy nhất cho `shares` và `attachments`

Hiện tại một dòng `shares` hoặc `attachments` có thể:

- Không trỏ đến tài nguyên nào (tất cả FK NULL).
- Trỏ đồng thời đến nhiều tài nguyên (ví dụ vừa có `note_id` vừa có `task_id`).

Để mỗi dòng có **đúng một target**, thêm:

```sql
ALTER TABLE "shares"
ADD CONSTRAINT "chk_shares_one_target"
CHECK (
  num_nonnulls("note_id", "task_id", "project_id", "subject_id", "collection_id") = 1
);

ALTER TABLE "shares"
ADD CONSTRAINT "chk_shares_not_self"
CHECK ("owner_id" <> "shared_with_user_id");

ALTER TABLE "attachments"
ADD CONSTRAINT "chk_attachments_one_owner"
CHECK (
  num_nonnulls("note_id", "task_id", "project_id", "collection_id") = 1
);
```

Như vậy, mỗi share/attachment luôn có nghĩa rõ ràng: nó gắn với **một** note, task, project, subject, hoặc collection cụ thể.

### 5. Dùng `timestamptz` và thêm trigger cho `updated_at`

Để hỗ trợ sync đa thiết bị và timezone người dùng, các cột thời gian như:

- `created_at`, `updated_at`, `due_at`, `completed_at`, `start_at`, `end_at`, `expires_at`, `completed_at` (backup)

nên dùng `TIMESTAMPTZ` thay vì `timestamp`, với `DEFAULT now()`.

Thêm một trigger dùng chung cho `updated_at`:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON "users"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Tương tự cho semesters, subjects, projects, notes, tasks, schedules, collections
```

Nhờ vậy, `updated_at` luôn phản ánh lần cập nhật cuối, không phụ thuộc vào việc ứng dụng có nhớ set tay hay không.[^3_2]

### 6. CHECK cho khoảng thời gian, số phút, trạng thái hoàn thành

Thêm các CHECK cơ bản để tránh dữ liệu “bẩn”:

```sql
ALTER TABLE "semesters"
ADD CONSTRAINT "chk_semesters_dates"
CHECK (
  "start_date" IS NULL
  OR "end_date" IS NULL
  OR "end_date" >= "start_date"
);

ALTER TABLE "projects"
ADD CONSTRAINT "chk_projects_dates"
CHECK (
  "start_date" IS NULL
  OR "due_date" IS NULL
  OR "due_date" >= "start_date"
);

ALTER TABLE "schedules"
ADD CONSTRAINT "chk_schedules_time"
CHECK ("end_at" > "start_at");

ALTER TABLE "tasks"
ADD CONSTRAINT "chk_tasks_estimated_minutes"
CHECK ("estimated_minutes" IS NULL OR "estimated_minutes" > 0);

ALTER TABLE "tasks"
ADD CONSTRAINT "chk_tasks_actual_minutes"
CHECK ("actual_minutes" IS NULL OR "actual_minutes" >= 0);

ALTER TABLE "tasks"
ADD CONSTRAINT "chk_tasks_completion_state"
CHECK (
  ("status" = 'completed' AND "completed_at" IS NOT NULL)
  OR ("status" <> 'completed' AND "completed_at" IS NULL)
);

ALTER TABLE "attachments"
ADD CONSTRAINT "chk_attachments_file_size"
CHECK ("file_size" IS NULL OR "file_size" >= 0);

ALTER TABLE "subjects"
ADD CONSTRAINT "chk_subjects_credits"
CHECK ("credits" IS NULL OR "credits" > 0);
```

Những ràng buộc này giúp đảm bảo dữ liệu có ý nghĩa khi dùng cho màn hình tiến độ, lịch và báo cáo.[^3_1]

### 7. Bổ sung `project_members` (nhóm đồ án)

Để đúng với use case đồ án nhóm, nên thêm bảng:

```sql
CREATE TYPE "project_role" AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE "project_members" (
  "project_id" uuid NOT NULL REFERENCES "projects" ("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "role" project_role NOT NULL DEFAULT 'editor',
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("project_id", "user_id")
);
```

Sau này có thể thêm `tasks.assignee_user_id` để gán task cho từng thành viên trong project; nhưng ở Bước 2 chỉ cần chuẩn bị bảng để Bước 4 triển khai logic là đủ.[^3_2][^3_1]

## Index và search (bản cuối)

Các index bạn đã khai báo là tốt; để đáp ứng yêu cầu **search theo nội dung** ở Bước 1, nên bổ sung full‑text search:

```sql
ALTER TABLE "notes"
ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' || coalesce("content", '')
  )
) STORED;

CREATE INDEX "idx_notes_search_vector"
ON "notes" USING GIN ("search_vector")
WHERE "deleted_at" IS NULL;

ALTER TABLE "tasks"
ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' || coalesce("description", '')
  )
) STORED;

CREATE INDEX "idx_tasks_search_vector"
ON "tasks" USING GIN ("search_vector")
WHERE "deleted_at" IS NULL;
```

Kết hợp với các index B‑tree hiện có (`user_id`, `subject_id`, `project_id`, `status`, `priority`, `due_at`...), hệ thống sẽ hỗ trợ tốt việc search + filter theo text, môn học, tag, trạng thái, ưu tiên và thời gian như charter yêu cầu.[^3_2][^3_1]

## Tiêu chí “Bước 2 hoàn tất”

Ta có thể coi **Bước 2 – Thiết kế mô hình dữ liệu \& schema** đã hoàn thiện khi:

- Đã chốt bộ `TYPE`/enum như trên, phù hợp với logic sản phẩm.
- Đã thống nhất ERD gồm các bảng: `users`, `semesters`, `subjects`, `projects`, `project_members`, `notes`, `tasks`, `schedules`, `tags`, `note_tags`, `task_tags`, `attachments`, `collections`, `shares`, `backups`.
- Đã viết DDL tương đương với schema bạn đưa ra, kèm theo các điều chỉnh bắt buộc:
    - CHECK ngữ cảnh học tập cho `notes` và `tasks`.
    - Ràng buộc ownership theo `user_id`.
    - Bắt buộc `semester_id` cho `subjects` và `projects` với `ON DELETE` hợp lý.
    - CHECK cho shares/attachments/schedules/tasks/semesters/projects/subjects.
    - Trigger cho `updated_at` và dùng `timestamptz`.
    - Full‑text search cho `notes` và `tasks`.
- Những quyết định phạm vi (ví dụ `public` visibility, `comment/admin` permission, `repeat_rule`, `pdf` backup…) đã được đánh dấu là **có thể dùng nhưng không bắt buộc trong MVP**, để Bước 3–4 triển khai code có thể ưu tiên phần core trước.[^3_2][^3_1]

Với bộ chỉnh sửa trên, schema hiện tại của bạn chính là **phiên bản v1 hoàn chỉnh cho Bước 2**, sẵn sàng dùng làm nguồn cho migration ở Bước 4 trong `AI_NOTE_FLOW_V1`.

<div align="center">⁂</div>

[^3_1]: đánh dấu các bước/Bước 1 – Định nghĩa sản phẩm \& phạm vi cho AI Note.md

[^3_2]: chat/tôi muốn tiến trình được chia thành các bước lớn,.md


---

# trình bày đầy đủ và chính xác cho bước 2

Bước 2 trong `AI_NOTE_FLOW_V1` là **Thiết kế mô hình dữ liệu \& schema**: chốt toàn bộ thực thể, quan hệ, enum, ràng buộc và index cho hệ thống AI Note, bám đúng triết lý “Học kỳ → Môn học/Dự án → Notes \& Tasks + Tag” và chống “note rác”.[^4_1][^4_2]

## Mục tiêu của Bước 2

- Biến các ý tưởng ở Bước 1 (trục Học kỳ/Môn học/Dự án, chống note rác, search + backup) thành **mô hình dữ liệu cụ thể trên PostgreSQL**.[^4_2]
- Đảm bảo mọi ghi chú và công việc đều có **ngữ cảnh học tập rõ ràng** (môn/dự án trong một học kỳ) và đều thuộc về **một người dùng** (ownership theo `user_id`).[^4_2]
- Chuẩn bị đầy đủ để Bước 4 có thể chuyển mô hình này sang **DDL/migrations** mà không phải nghĩ lại schema.[^4_1]


## Thực thể chính (bảng lõi)

Bước 2 chốt danh sách bảng chính cần có trong hệ thống non‑AI core:[^4_1]

- `users`: thông tin tài khoản sinh viên (email, mật khẩu mã hóa, tên hiển thị, avatar, timezone, trạng thái).[^4_1]
- `semesters`: học kỳ của từng sinh viên (tên học kỳ, năm học, ngày bắt đầu/kết thúc, trạng thái, cờ `is_current`).[^4_2][^4_1]
- `subjects`: môn học thuộc về một học kỳ (mã môn, tên, số tín chỉ, màu, trạng thái).[^4_2][^4_1]
- `projects`: đồ án/dự án trong một học kỳ, có thể gắn với một môn (tên, mô tả, trạng thái, ngày bắt đầu/dự kiến hoàn thành).[^4_1][^4_2]
- `project_members`: thành viên tham gia từng project (project, user, vai trò owner/editor/viewer, thời điểm tham gia) để hỗ trợ đồ án nhóm.[^4_2]
- `notes`: ghi chú bài giảng, bài đọc, bài tập, ý tưởng, ôn thi… gắn với môn/dự án trong một học kỳ.[^4_1][^4_2]
- `tasks`: công việc học tập (bài tập, việc đọc chương, việc ôn thi, việc trong đồ án) gắn với môn/dự án trong một học kỳ.[^4_2][^4_1]
- `schedules`: các sự kiện lịch (buổi học, kỳ thi, buổi ôn tập, họp nhóm) liên kết với học kỳ, môn hoặc dự án.[^4_1][^4_2]
- `tags`: nhãn phân loại do từng người dùng tự tạo (chủ đề, chương, dạng bài).[^4_2][^4_1]
- `note_tags` và `task_tags`: bảng trung gian quan hệ **n‑n** giữa notes/tasks và tags.[^4_1]
- `attachments`: metadata tệp đính kèm (file name, storage key, mime, size, checksum), gắn với note/task/project/collection.[^4_1]
- `collections`: tập hợp ghi chú/tài liệu (nhóm theo notebook, chủ đề, hoặc thư mục cá nhân), có thể lồng nhau qua `parent_collection_id`.[^4_1]
- `shares`: record chia sẻ một note/task/project/subject/collection từ owner đến một user khác với quyền cụ thể.[^4_2][^4_1]
- `backups`: log các lần backup/export (loại backup, phạm vi, file sinh ra, kích thước, checksum, trạng thái xử lý).[^4_2][^4_1]


## Quan hệ và ERD logic

Bước 2 định rõ **cách các bảng liên kết với nhau** theo trục Học kỳ/Môn học/Dự án:[^4_2][^4_1]

- Một `user` có nhiều `semesters`, `subjects`, `projects`, `notes`, `tasks`, `tags`, `collections`, `attachments`, `shares` và `backups` (quan hệ 1‑n qua `user_id`).[^4_1][^4_2]
- Mỗi `semester` thuộc về một `user`, và là “cha” của nhiều `subjects` và `projects` (1‑n).[^4_2][^4_1]
- Mỗi `subject` thuộc về một `semester` và một `user`; mỗi `project` cũng thuộc về một `semester` và một `user`, và có thể liên kết thêm với một `subject`.[^4_1][^4_2]
- Mỗi `note` và `task` thuộc về một `user`, nằm trong một `semester`, và được gắn **ít nhất một trong hai**: `subject` hoặc `project` để luôn có ngữ cảnh học tập.[^4_2]
- `project_members` liên kết nhiều `user` vào một `project` với vai trò khác nhau (quan hệ n‑n triển khai bằng bảng trung gian).[^4_2]
- `tags` thuộc về một `user`; `note_tags` và `task_tags` cho phép mỗi note/task có nhiều tag, mỗi tag được dùng cho nhiều note/task.[^4_1][^4_2]
- `attachments` có thể gắn với đúng một trong các loại owner: note, task, project hoặc collection, tránh mơ hồ.[^4_1]
- `shares` luôn chỉ ra **một target duy nhất** (note, task, project, subject hoặc collection) cùng với owner và user được chia sẻ, để cho phép thiết kế màn hình chia sẻ rõ ràng.[^4_2][^4_1]
- `schedules` liên kết với `user`, và tùy theo trường hợp có thể liên kết thêm với `semester`, `subject`, `project` hoặc `task` để phản ánh lớp học, kỳ thi, buổi học nhóm hoặc deadline.[^4_1][^4_2]


## Enum / TYPE trạng thái

Bước 2 chốt các `CREATE TYPE` dùng xuyên suốt hệ thống để đảm bảo dữ liệu thống nhất:[^4_1]

- Trạng thái người dùng: `user_status` với `active`, `suspended`, `deleted` (quản lý lifecycle tài khoản).[^4_1]
- Trạng thái học kỳ: `semester_status` với `planned`, `active`, `completed`, `archived` (phân biệt học kỳ đang học, đã xong, lưu trữ).[^4_2][^4_1]
- Trạng thái môn: `subject_status` với `active`, `completed`, `archived`.[^4_1]
- Trạng thái dự án: `project_status` với `planned`, `active`, `completed`, `archived`.[^4_1]
- Loại note (`note_type`): `lecture`, `reading`, `idea`, `assignment`, `exam_review`, `experience`, `general` để phân loại ghi chú theo ngữ cảnh và mục đích (bài giảng, bài đọc, bài tập, ôn thi, kinh nghiệm...).[^4_2][^4_1]
- Độ riêng tư note (`note_visibility`): `private`, `shared`, `public` (MVP dùng chủ yếu `private` và `shared`).[^4_2][^4_1]
- Trạng thái task (`task_status`): `not_started`, `in_progress`, `completed`, `cancelled` (bao quát việc chưa làm, đang làm, đã xong và hủy).[^4_2][^4_1]
- Mức độ ưu tiên (`task_priority`): `low`, `medium`, `high`, `urgent` để support filter và màn hình ưu tiên công việc.[^4_2][^4_1]
- Loại lịch (`schedule_type`): `class`, `exam`, `assignment`, `study`, `meeting`, `other` cho các loại sự kiện trong lịch.[^4_1][^4_2]
- Quyền chia sẻ (`share_permission`): `view`, `comment`, `edit`, `admin` (MVP triển khai `view` và `edit`, `comment/admin` để dành cho mở rộng).[^4_2][^4_1]
- Loại backup (`backup_type`): `markdown`, `json`, `pdf`, `full_backup` để phân biệt xuất ghi chú, dữ liệu cấu trúc hoặc export full.[^4_1][^4_2]
- Phạm vi backup (`backup_scope`): `all`, `semester`, `subject`, `project`, `collection` (backup toàn tài khoản hoặc một học kỳ/môn/dự án/collection).[^4_2][^4_1]
- Trạng thái backup (`backup_status`): `pending`, `processing`, `completed`, `failed` để quản lý job export chạy nền.[^4_1][^4_2]


## Thiết kế trường thời gian \& timezone

Bước 2 xác định nguyên tắc chung cho cột thời gian:[^4_1]

- Tất cả cột thời điểm như `created_at`, `updated_at`, `due_at`, `completed_at`, `start_at`, `end_at`, `expires_at`, `joined_at` (project_members), `completed_at` (backups) dùng **`timestamptz`** với `DEFAULT now()` để lưu giá trị UTC và hiển thị theo `users.timezone`.[^4_2][^4_1]
- Các cột chỉ cần ngày (không giờ) như `start_date`, `end_date` (semesters), `start_date`/`due_date` (projects), `academic_year` dùng kiểu `date` hoặc `varchar` phù hợp với ngữ nghĩa ngày.[^4_1]
- `updated_at` trên các bảng có trigger dùng chung để tự set thành `now()` mỗi khi record được cập nhật, tránh lệ thuộc vào việc ứng dụng set tay.[^4_1]


## Ràng buộc dữ liệu quan trọng (CHECK, NOT NULL, ownership)

Để đảm bảo **toàn vẹn dữ liệu** và tránh “note rác” hay dữ liệu mơ hồ, Bước 2 đưa ra các ràng buộc chính:[^4_2][^4_1]

1. **Ngữ cảnh học tập cho note/task**
    - `notes`: thêm CHECK `subject_id IS NOT NULL OR project_id IS NOT NULL` để mọi ghi chú đều thuộc ít nhất một môn hoặc dự án.[^4_2]
    - `tasks`: thêm CHECK tương tự để mọi công việc đều gắn vào môn hoặc dự án, không có task “trôi nổi”.[^4_2]
2. **Ownership theo user_id xuyên bảng**
    - Các bảng như `semesters`, `subjects`, `projects`, `notes`, `tasks`, `tags`, `collections` đều có `user_id` là cột bắt buộc, thể hiện chủ sở hữu.[^4_1][^4_2]
    - Bổ sung cơ chế bảo đảm một resource con không thể gắn resource cha thuộc user khác (bằng composite FK `(id, user_id)` hoặc trigger kiểm tra), giữ đúng nguyên tắc dữ liệu riêng tư theo người dùng.[^4_2]
3. **Học kỳ cho môn và dự án**
    - `subjects.semester_id` và `projects.semester_id` được đặt `NOT NULL`, vì theo triết lý sản phẩm mọi môn học và dự án đều thuộc một học kỳ (không có môn/dự án “ngoài học kỳ”).[^4_2]
4. **Một target duy nhất cho shares và attachments**
    - `shares`: dùng CHECK với `num_nonnulls(note_id, task_id, project_id, subject_id, collection_id) = 1` để mỗi record share chỉ nhắm **một loại tài nguyên**.[^4_1]
    - Đồng thời có CHECK đảm bảo không được chia sẻ “cho chính mình” (`owner_id <> shared_with_user_id`).[^4_1]
    - `attachments`: dùng CHECK tương tự với `note_id`, `task_id`, `project_id`, `collection_id` để mỗi tệp đính kèm chỉ thuộc một owner rõ ràng.[^4_1]
5. **Khoảng thời gian và số lượng hợp lý**
    - Học kỳ và dự án: CHECK đảm bảo `end_date >= start_date` nếu cả hai không NULL.[^4_1]
    - Lịch (`schedules`): CHECK `end_at > start_at` để tránh sự kiện có thời lượng âm hoặc bằng 0.[^4_1]
    - Task: CHECK cho `estimated_minutes > 0` nếu không NULL, `actual_minutes >= 0` nếu không NULL, và trạng thái hoàn thành phải khớp với `completed_at` (nếu `status = 'completed'` thì `completed_at` không NULL, ngược lại phải NULL).[^4_1]
    - Attachments và `subjects.credits` có CHECK đảm bảo `file_size` và `credits` không âm và hợp lý.[^4_1]

## Chính sách khóa ngoại \& ON DELETE

Bước 2 cũng chốt chính sách khi xóa để không gây mất dữ liệu ngoài ý muốn:[^4_1]

- Các FK từ `semesters`/`subjects`/`projects` xuống `notes` và `tasks` dùng `ON DELETE SET NULL` hoặc `RESTRICT` tùy chính sách, nhưng logic ứng dụng không cho phép để lại note/task mà hoàn toàn mất ngữ cảnh học tập.[^4_2][^4_1]
- FK từ `users` tới các bảng con (`semesters`, `subjects`, `projects`, `notes`, `tasks`, `tags`, `collections`, `attachments`, `shares`, `backups`) sử dụng `ON DELETE CASCADE` hoặc quy trình xóa tài khoản riêng có kiểm soát, để đảm bảo khi xóa user không để lại rác dữ liệu không truy cập được.[^4_1]
- Các bảng trung gian `note_tags`, `task_tags`, `project_members` dùng `ON DELETE CASCADE` để khi xóa note/task/project hoặc tag thì quan hệ n‑n liên quan được dọn sạch tự động.[^4_1]
- FK từ `schedules` đến `subjects`/`projects` dùng `ON DELETE SET NULL` để giữ lại lịch sử sự kiện ngay cả khi subject/project bị xóa mềm.[^4_1]


## Index \& full‑text search

Để đáp ứng yêu cầu “tìm lại ghi chú nhanh, search + filter hiệu quả”, Bước 2 xác định hệ thống index như sau:[^4_2][^4_1]

- Index B‑tree cho các truy vấn phổ biến:
    - `semesters(user_id, start_date)` và `semesters(user_id, is_current)`.
    - `subjects(user_id, name)`, `subjects(semester_id)`, `subjects(code)`.
    - `projects(user_id, status)`, `projects(subject_id)`, `projects(due_date)`.
    - `notes(user_id, updated_at)`, `notes(user_id, note_type)`, `notes(subject_id)`, `notes(semester_id)`, `notes(project_id)`, `notes(collection_id)`, `notes(visibility)`.
    - `tasks(user_id, due_at)`, `tasks(user_id, status)`, `tasks(user_id, priority)`, `tasks(subject_id, status)`, `tasks(project_id)`, `tasks(parent_task_id)`.
    - `schedules(user_id, start_at, end_at)`, `schedules(subject_id)`, `schedules(project_id)`, `schedules(event_type)`.
    - Index cho `tags`, `note_tags.tag_id`, `task_tags.tag_id`, `attachments` theo owner, `collections`, `shares`, `backups` theo trường lọc chính.[^4_1]
- Full‑text search cho nội dung:
    - Thêm cột `search_vector` dạng `tsvector` cho `notes`, sinh từ `title + content`, và index GIN tương ứng, có điều kiện `WHERE deleted_at IS NULL`.[^4_2][^4_1]
    - Tương tự, thêm `search_vector` cho `tasks` từ `title + description` để hỗ trợ search task theo nội dung.[^4_2][^4_1]

Nhờ đó, search có thể kết hợp **full‑text** với các filter theo môn học, loại note, tag, trạng thái, ưu tiên, thời gian – đúng với yêu cầu ở Bước 1.[^4_2]

## Tiêu chí “Bước 2 done”

Bước 2 được coi là **hoàn thành đầy đủ và chính xác** khi các điều kiện sau được đáp ứng:[^4_1]

- Đã liệt kê và chốt toàn bộ thực thể chính và bảng trung gian cho hệ thống non‑AI core (users, semesters, subjects, projects, project_members, notes, tasks, schedules, tags, note_tags, task_tags, attachments, collections, shares, backups).[^4_2][^4_1]
- Đã xác định rõ ERD: quan hệ 1‑n, n‑n, thứ bậc Học kỳ → Môn học/Dự án → Notes/Tasks, và cách tags/collections/shares/attachments gắn vào mô hình này.[^4_2][^4_1]
- Đã chốt bộ enum/TYPE và các CHECK quan trọng cho trạng thái, ưu tiên, khoảng thời gian, ngữ cảnh học tập, ownership và target chia sẻ/đính kèm.[^4_2][^4_1]
- Đã thiết kế chính sách thời gian (dùng `timestamptz`), timezone, trigger `updated_at`, và chính sách `ON DELETE`/soft delete phù hợp để không mất dữ liệu học tập.[^4_2][^4_1]
- Đã xác định hệ thống index và full‑text search cho notes/tasks đủ để hỗ trợ use case search + filter của sinh viên.[^4_2][^4_1]

Khi tất cả các phần trên được viết thành tài liệu hoặc DDL rõ ràng và thống nhất, bạn có một **Bước 2 hoàn chỉnh**, sẵn sàng chuyển sang Bước 3 (kiến trúc hệ thống) và Bước 4 (migrations + backend core) trong `AI_NOTE_FLOW_V1`.

<div align="center">⁂</div>

[^4_1]: chat/tôi muốn tiến trình được chia thành các bước lớn,.md

[^4_2]: đánh dấu các bước/Bước 1 – Định nghĩa sản phẩm \& phạm vi cho AI Note.md

