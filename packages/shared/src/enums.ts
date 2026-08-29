export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

export enum SemesterStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum SubjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum ProjectMemberStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
}

export enum NoteType {
  LECTURE = 'LECTURE',
  LAB_REPORT = 'LAB_REPORT',
  EXAM_PREP = 'EXAM_PREP',
  PROJECT_LOG = 'PROJECT_LOG',
  MEETING_MINUTES = 'MEETING_MINUTES',
  GENERAL = 'GENERAL'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ScheduleEventType {
  CLASS = 'CLASS',
  EXAM = 'EXAM',
  DEADLINE = 'DEADLINE',
  GROUP_MEETING = 'GROUP_MEETING',
  PERSONAL = 'PERSONAL'
}

export enum ShareTargetType {
  NOTE = 'NOTE',
  TASK = 'TASK',
  PROJECT = 'PROJECT',
  COLLECTION = 'COLLECTION'
}

export enum ShareAccessLevel {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN'
}

