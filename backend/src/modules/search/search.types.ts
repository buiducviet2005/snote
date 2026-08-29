export interface GlobalSearchQueryDto {
  q?: string;
  subjectId?: string;
  semesterId?: string;
  tagId?: string;
  status?: string;
  priority?: string;
  itemTypes?: string; // 'notes,tasks,projects,schedule'
  startDate?: string;
  endDate?: string;
  isPinned?: boolean;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'NOTE' | 'TASK' | 'PROJECT' | 'SCHEDULE_EVENT';
  title: string;
  snippet?: string;
  subject?: { id: string; name: string; code?: string | null; color?: string | null } | null;
  status?: string | null;
  priority?: string | null;
  dueDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPinned?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GlobalSearchResultDto {
  notes: SearchResultItem[];
  tasks: SearchResultItem[];
  projects: SearchResultItem[];
  scheduleEvents: SearchResultItem[];
  totalCount: number;
}
