export interface UserBackupPayload {
  exportVersion: string;
  exportedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    timezone: string;
    createdAt: Date | string;
  };
  semesters: any[];
  subjects: any[];
  projects: any[];
  notes: any[];
  tasks: any[];
  tags: any[];
  scheduleEvents: any[];
}
