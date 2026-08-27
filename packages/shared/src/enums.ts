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

export enum SemesterStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum ScheduleEventType {
  CLASS = 'CLASS',
  EXAM = 'EXAM',
  DEADLINE = 'DEADLINE',
  GROUP_MEETING = 'GROUP_MEETING',
  PERSONAL = 'PERSONAL'
}
