const DRAFT_PREFIX = 'snote_note_draft_';

export const draftStorage = {
  save(noteId: string, content: string): void {
    if (!noteId) return;
    try {
      localStorage.setItem(`${DRAFT_PREFIX}${noteId}`, JSON.stringify({
        content,
        timestamp: Date.now()
      }));
    } catch {
      // Ignore quota exceeded errors
    }
  },

  get(noteId: string): { content: string; timestamp: number } | null {
    if (!noteId) return null;
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${noteId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  remove(noteId: string): void {
    if (!noteId) return;
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${noteId}`);
    } catch {
      // Ignore errors
    }
  }
};
