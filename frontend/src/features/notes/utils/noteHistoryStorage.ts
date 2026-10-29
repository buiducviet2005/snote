export type NoteVersionType = 'AUTO_SAVE' | 'MANUAL_SAVE' | 'RESTORE_POINT' | 'INITIAL';

export interface NoteVersionSnapshot {
  id: string;
  noteId: string;
  title: string;
  content: string;
  timestamp: number;
  formattedTime: string;
  formattedDate: string;
  wordCount: number;
  charCount: number;
  type: NoteVersionType;
  description?: string;
}

const HISTORY_PREFIX = 'snote_note_history_';
const MAX_SNAPSHOTS_PER_NOTE = 50;

function formatDateTime(ts: number): { time: string; date: string } {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { time, date };
}

function calculateWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export const noteHistoryStorage = {
  getSnapshots(noteId: string): NoteVersionSnapshot[] {
    if (!noteId) return [];
    try {
      const raw = localStorage.getItem(`${HISTORY_PREFIX}${noteId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch {
      return [];
    }
  },

  saveSnapshot(
    noteId: string,
    title: string,
    content: string,
    type: NoteVersionType = 'AUTO_SAVE',
    description?: string
  ): NoteVersionSnapshot | null {
    if (!noteId) return null;

    try {
      const existing = this.getSnapshots(noteId);
      const latest = existing[0];

      // Don't save duplicate snapshot if both title and content are identical to latest
      if (latest && latest.title === title.trim() && latest.content === content) {
        return null;
      }

      const now = Date.now();
      const { time, date } = formatDateTime(now);

      const newSnapshot: NoteVersionSnapshot = {
        id: `snap_${now}_${Math.random().toString(36).slice(2, 6)}`,
        noteId,
        title: title.trim() || '',
        content: content || '',
        timestamp: now,
        formattedTime: time,
        formattedDate: date,
        wordCount: calculateWordCount(content),
        charCount: content.length,
        type,
        description
      };

      const updated = [newSnapshot, ...existing].slice(0, MAX_SNAPSHOTS_PER_NOTE);
      localStorage.setItem(`${HISTORY_PREFIX}${noteId}`, JSON.stringify(updated));
      return newSnapshot;
    } catch {
      return null;
    }
  },

  clearSnapshots(noteId: string): void {
    if (!noteId) return;
    try {
      localStorage.removeItem(`${HISTORY_PREFIX}${noteId}`);
    } catch {
      // Ignore
    }
  }
};
