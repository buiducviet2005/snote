import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  searchTerms: string[];
  command: (params: { editor: any; range: any }) => void;
}

export const getSlashCommands = (
  onConvertToTask?: (text: string) => void,
  t?: (key: string) => string
): SlashCommandItem[] => [
  {
    title: t ? t('slash.h1_title') : 'Tiêu đề 1 (H1)',
    description: t ? t('slash.h1_desc') : 'Đề mục chính của bài giảng / môn học',
    icon: 'H1',
    searchTerms: ['h1', 'heading', 'tieu de', 'lon'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    }
  },
  {
    title: t ? t('slash.h2_title') : 'Tiêu đề 2 (H2)',
    description: t ? t('slash.h2_desc') : 'Đề mục phụ / nội dung chi tiết',
    icon: 'H2',
    searchTerms: ['h2', 'heading', 'tieu de', 'nho'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    }
  },
  {
    title: t ? t('slash.h3_title') : 'Tiêu đề 3 (H3)',
    description: t ? t('slash.h3_desc') : 'Phần mục nhỏ / ví dụ',
    icon: 'H3',
    searchTerms: ['h3', 'heading', 'vi du'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    }
  },
  {
    title: t ? t('slash.todo_title') : 'Danh sách việc (To-do)',
    description: t ? t('slash.todo_desc') : 'Hộp kiểm có thể tick trực tiếp để gạch việc',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
    searchTerms: ['todo', 'task', 'checklist', 'viec', 'hop kiem'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    }
  },
  {
    title: t ? t('slash.bullet_title') : 'Danh sách gạch đầu dòng',
    description: t ? t('slash.bullet_desc') : 'Liệt kê các ý kiến, khái niệm',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    searchTerms: ['bullet', 'list', 'danh sach', 'gach'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    }
  },
  {
    title: t ? t('slash.number_title') : 'Danh sách đánh số',
    description: t ? t('slash.number_desc') : 'Các bước thực hành hoặc thứ tự ưu tiên',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
    searchTerms: ['number', 'ordered', 'so', 'thu tu'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    }
  },
  {
    title: t ? t('slash.code_title') : 'Khối mã nguồn (Code Block)',
    description: t ? t('slash.code_desc') : 'Đoạn mã lập trình cho môn Công nghệ thông tin',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    searchTerms: ['code', 'ma', 'lap trinh', 'snippet'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    }
  },
  {
    title: t ? t('slash.quote_title') : 'Trích dẫn (Quote)',
    description: t ? t('slash.quote_desc') : 'Trích lời giảng viên, công thức hoặc định lý',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 4.5 2 7 5 8"/><path d="M15 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 4.5 2 7 5 8"/></svg>',
    searchTerms: ['quote', 'trich dan', 'dinh ly'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    }
  },
  {
    title: t ? t('slash.divider_title') : 'Đường phân cách (Divider)',
    description: t ? t('slash.divider_desc') : 'Đường kẻ ngang chia tách các phần bài học',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>',
    searchTerms: ['divider', 'hr', 'line', 'duong ke', 'ngan'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    }
  },
  ...(onConvertToTask ? [{
    title: t ? t('notes.convert_to_task') : 'Tạo công việc SNOTE (Task)',
    description: t ? t('slash.todo_desc') : 'Chuyển nội dung này thành bài tập có hạn nộp',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    searchTerms: ['task', 'cong viec', 'bai tap', 'deadline'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).run();
      onConvertToTask('');
    }
  }] : [])
];

export const createSlashCommandExtension = (
  onConvertToTask?: (text: string) => void,
  t?: (key: string) => string
) => {
  return Extension.create({
    name: 'slashCommand',

    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
            props.command({ editor, range });
          }
        }
      };
    },

    addProseMirrorPlugins() {
      const itemsList = getSlashCommands(onConvertToTask, t);

      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => {
            const q = query.toLowerCase().trim();
            if (!q) return itemsList;
            return itemsList.filter((item) =>
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.searchTerms.some((t) => t.includes(q))
            );
          },
          render: () => {
            let container: HTMLDivElement | null = null;
            let selectedIndex = 0;
            let currentItems: SlashCommandItem[] = [];
            let currentProps: SuggestionProps | null = null;

            const updateSelection = () => {
              if (!container) return;
              const buttons = container.querySelectorAll('.snote-slash-item');
              buttons.forEach((btn, idx) => {
                if (idx === selectedIndex) {
                  btn.classList.add('selected');
                  (btn as HTMLElement).scrollIntoView({ block: 'nearest' });
                } else {
                  btn.classList.remove('selected');
                }
              });
            };

            const renderItems = () => {
              if (!container) return;
              container.innerHTML = '';
              if (currentItems.length === 0) {
                container.innerHTML = `<div class="snote-slash-empty">${t ? t('palette.no_results') : 'Không tìm thấy lệnh phù hợp'}</div>`;
                return;
              }

              currentItems.forEach((item, index) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `snote-slash-item ${index === selectedIndex ? 'selected' : ''}`;
                btn.innerHTML = `
                  <span class="snote-slash-icon">${item.icon}</span>
                  <div class="snote-slash-text">
                    <span class="snote-slash-title">${item.title}</span>
                    <span class="snote-slash-desc">${item.description}</span>
                  </div>
                `;
                btn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (currentProps) {
                    currentProps.command(item);
                  }
                });
                container?.appendChild(btn);
              });
            };

            const positionContainer = (clientRect: (() => DOMRect | null) | null | undefined) => {
              if (!container || !clientRect) return;
              const rect = clientRect();
              if (!rect) return;

              const top = rect.bottom + window.scrollY + 6;
              const left = Math.min(rect.left + window.scrollX, window.innerWidth - 300);

              container.style.top = `${top}px`;
              container.style.left = `${Math.max(16, left)}px`;
            };

            return {
              onStart: (props: SuggestionProps) => {
                currentProps = props;
                currentItems = props.items as SlashCommandItem[];
                selectedIndex = 0;

                container = document.createElement('div');
                container.className = 'snote-slash-menu';
                document.body.appendChild(container);

                positionContainer(props.clientRect);
                renderItems();
              },

              onUpdate: (props: SuggestionProps) => {
                currentProps = props;
                currentItems = props.items as SlashCommandItem[];
                selectedIndex = Math.min(selectedIndex, Math.max(0, currentItems.length - 1));

                positionContainer(props.clientRect);
                renderItems();
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (!container || currentItems.length === 0) return false;

                if (props.event.key === 'ArrowDown') {
                  selectedIndex = (selectedIndex + 1) % currentItems.length;
                  updateSelection();
                  return true;
                }

                if (props.event.key === 'ArrowUp') {
                  selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length;
                  updateSelection();
                  return true;
                }

                if (props.event.key === 'Enter') {
                  const chosen = currentItems[selectedIndex];
                  if (chosen && currentProps) {
                    currentProps.command(chosen);
                    return true;
                  }
                }

                if (props.event.key === 'Escape') {
                  container.remove();
                  container = null;
                  return true;
                }

                return false;
              },

              onExit: () => {
                if (container) {
                  container.remove();
                  container = null;
                }
              }
            };
          }
        })
      ];
    }
  });
};
