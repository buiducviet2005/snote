export type AiPromptType =
  | 'GENERAL'
  | 'EXTRACT_TODOS'
  | 'EXAM_PREDICT'
  | 'SUMMARIZE'
  | 'EXPLAIN_CONCEPT'
  | 'STUDY_PLAN';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AiChatRequestDto {
  message: string;
  promptType?: AiPromptType;
  subjectId?: string;
  noteId?: string;
  contextText?: string;
  history?: AiChatMessage[];
}

export interface AiChatResponseDto {
  reply: string;
  suggestedActions?: {
    actionType: 'CREATE_TASK' | 'CREATE_NOTE' | 'SET_REMINDER';
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }[];
  tokensUsed?: number;
  model?: string;
}
