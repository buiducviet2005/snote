import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WorkspaceSummary } from './types';
import {
  Search,
  FileText,
  CheckSquare,
  Maximize2,
  Minimize2,
  Clock,
  BookOpen,
  FolderKanban,
  User,
  ArrowRight,
  Sparkles,
  Command as CommandIcon,
  X
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'ACTIONS' | 'WORKSPACES' | 'NAVIGATION';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface WorkspaceCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary;
  onSelectWorkspace: (ws: WorkspaceSummary) => void;
  onSelectNav: (navId: string) => void;
  onOpenCreateNote?: () => void;
  onOpenCreateTask?: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onToggleTimer: () => void;
}

export const WorkspaceCommandPalette: React.FC<WorkspaceCommandPaletteProps> = ({
  isOpen,
  onClose,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onSelectNav,
  onOpenCreateNote,
  onOpenCreateTask,
  isZenMode,
  onToggleZenMode,
  onToggleTimer
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Construct all possible commands
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // 1. Core Quick Actions
      {
        id: 'action-note',
        category: 'ACTIONS',
        title: 'Tạo ghi chú mới',
        subtitle: `Trong không gian: ${currentWorkspace.name}`,
        icon: <FileText size={16} />,
        shortcut: 'N',
        action: () => {
          onClose();
          if (onOpenCreateNote) onOpenCreateNote();
        }
      },
      {
        id: 'action-task',
        category: 'ACTIONS',
        title: 'Tạo bài tập / Nhiệm vụ mới',
        subtitle: `Gán hạn chót và thành viên trong ${currentWorkspace.name}`,
        icon: <CheckSquare size={16} />,
        shortcut: 'T',
        action: () => {
          onClose();
          if (onOpenCreateTask) onOpenCreateTask();
        }
      },
      {
        id: 'action-zen',
        category: 'ACTIONS',
        title: isZenMode ? 'Tắt chế độ Zen (Hiện thanh bên)' : 'Bật chế độ Zen (Tập trung toàn màn hình)',
        subtitle: 'Ẩn hoàn toàn phân tâm, tối đa hóa không gian học tập',
        icon: isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />,
        shortcut: 'Z',
        action: () => {
          onClose();
          onToggleZenMode();
        }
      },
      {
        id: 'action-timer',
        category: 'ACTIONS',
        title: 'Bật / Dừng đồng hồ tập trung Pomodoro',
        subtitle: 'Chu kỳ 25 phút học tập sâu sắc (Deep Study)',
        icon: <Clock size={16} />,
        shortcut: 'P',
        action: () => {
          onClose();
          onToggleTimer();
        }
      },

      // 2. Navigation within workspace
      {
        id: 'nav-overview',
        category: 'NAVIGATION',
        title: 'Góc nhìn: Tổng quan bàn học',
        subtitle: 'Bento tóm tắt việc gấp, tiến độ và ghi chú gần đây',
        icon: <ArrowRight size={16} />,
        action: () => {
          onClose();
          onSelectNav('overview');
        }
      },
      {
        id: 'nav-notes',
        category: 'NAVIGATION',
        title: 'Góc nhìn: Kho ghi chú & Bài giảng',
        subtitle: 'Danh sách và nội dung ghi chép học tập',
        icon: <FileText size={16} />,
        action: () => {
          onClose();
          onSelectNav('notes');
        }
      },
      {
        id: 'nav-tasks',
        category: 'NAVIGATION',
        title: 'Góc nhìn: Bảng nhiệm vụ & Deadline',
        subtitle: 'Theo dõi tiến độ bài tập và đồ án',
        icon: <CheckSquare size={16} />,
        action: () => {
          onClose();
          onSelectNav('tasks');
        }
      }
    ];

    if (currentWorkspace.type === 'PROJECT') {
      list.push(
        {
          id: 'nav-kanban',
          category: 'NAVIGATION',
          title: 'Góc nhìn: Bảng Kanban đồ án',
          subtitle: 'Phân loại Todo, In Progress, Done theo cột',
          icon: <FolderKanban size={16} />,
          action: () => {
            onClose();
            onSelectNav('kanban');
          }
        },
        {
          id: 'nav-gantt',
          category: 'NAVIGATION',
          title: 'Góc nhìn: Dòng thời gian Gantt',
          subtitle: 'Lộ trình mốc nộp bài và thời gian thực hiện',
          icon: <Clock size={16} />,
          action: () => {
            onClose();
            onSelectNav('gantt');
          }
        }
      );
    }

    // 3. Switch to any workspace
    workspaces.forEach((ws) => {
      let icon = <FolderKanban size={16} />;
      let subtitle = 'Đồ án & BTL';
      if (ws.type === 'PERSONAL') {
        icon = <User size={16} />;
        subtitle = 'Không gian cá nhân riêng tư';
      } else if (ws.type === 'SUBJECT') {
        icon = <BookOpen size={16} />;
        subtitle = `Môn học [${ws.code || 'MÃ'}]`;
      }

      list.push({
        id: `ws-${ws.id}`,
        category: 'WORKSPACES',
        title: `Chuyển tới: ${ws.name}`,
        subtitle: `${subtitle} • ${ws.role === 'OWNER' ? 'Chủ sở hữu' : 'Thành viên'}`,
        icon,
        action: () => {
          onClose();
          onSelectWorkspace(ws);
        }
      });
    });

    return list;
  }, [
    currentWorkspace,
    workspaces,
    isZenMode,
    onClose,
    onOpenCreateNote,
    onOpenCreateTask,
    onToggleZenMode,
    onToggleTimer,
    onSelectNav,
    onSelectWorkspace
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  // Keyboard navigation inside command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('.ws-cmd-item.active') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="ws-cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ws-cmd-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="ws-cmd-search-bar">
          <Search size={18} className="ws-cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="ws-cmd-input"
            placeholder="Gõ lệnh hoặc tìm không gian, ghi chú, tác vụ... (Esc để thoát)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button
            type="button"
            className="ws-cmd-close-btn"
            onClick={onClose}
            title="Đóng hộp lệnh"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="ws-cmd-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="ws-cmd-empty">
              <span>Không tìm thấy lệnh hoặc tài liệu phù hợp với &quot;{query}&quot;</span>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`ws-cmd-item ${isSelected ? 'active' : ''}`}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="ws-cmd-item-icon">{cmd.icon}</div>
                  <div className="ws-cmd-item-body">
                    <div className="ws-cmd-item-title">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className="ws-cmd-item-subtitle">{cmd.subtitle}</div>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <kbd className="ws-cmd-kbd">{cmd.shortcut}</kbd>
                  )}
                  <span className="ws-cmd-enter-hint">↵</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="ws-cmd-footer">
          <div className="ws-cmd-hints">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Di chuyển
            </span>
            <span>
              <kbd>↵</kbd> Chọn
            </span>
            <span>
              <kbd>Esc</kbd> Đóng
            </span>
          </div>
          <div className="ws-cmd-tagline">
            SNOTE Precision Navigation
          </div>
        </div>
      </div>
    </div>
  );
};

