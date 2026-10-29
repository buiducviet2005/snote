import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WorkspaceSummary } from './types';
import { useLanguage } from '../../contexts/LanguageContext';
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
  Command as CommandIcon,
  X,
  Globe
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
}) => {
  const { t, language, toggleLanguage } = useLanguage();
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
        title: t('palette.create_note_title'),
        subtitle: t('palette.create_note_sub', { workspace: currentWorkspace.name }),
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
        title: t('palette.create_task_title'),
        subtitle: t('palette.create_task_sub', { workspace: currentWorkspace.name }),
        icon: <CheckSquare size={16} />,
        shortcut: 'T',
        action: () => {
          onClose();
          if (onOpenCreateTask) onOpenCreateTask();
        }
      },
      {
        id: 'action-toggle-lang',
        category: 'ACTIONS',
        title: language === 'vi' ? t('palette.switch_to_en') : t('palette.switch_to_vi'),
        subtitle: t('palette.toggle_lang_sub'),
        icon: <Globe size={16} />,
        shortcut: 'L',
        action: () => {
          toggleLanguage();
          onClose();
        }
      },

      // 2. Navigation within workspace
      {
        id: 'nav-overview',
        category: 'NAVIGATION',
        title: t('palette.nav_notes'),
        subtitle: t('palette.nav_notes_sub'),
        icon: <ArrowRight size={16} />,
        action: () => {
          onClose();
          onSelectNav('overview');
        }
      },
      {
        id: 'nav-notes',
        category: 'NAVIGATION',
        title: t('palette.nav_notes'),
        subtitle: t('palette.nav_notes_sub'),
        icon: <FileText size={16} />,
        action: () => {
          onClose();
          onSelectNav('notes');
        }
      },
      {
        id: 'nav-tasks',
        category: 'NAVIGATION',
        title: t('palette.nav_tasks'),
        subtitle: t('palette.nav_tasks_sub'),
        icon: <CheckSquare size={16} />,
        action: () => {
          onClose();
          onSelectNav('tasks');
        }
      },
      {
        id: 'nav-schedule',
        category: 'NAVIGATION',
        title: t('palette.nav_schedule'),
        subtitle: t('palette.nav_schedule_sub'),
        icon: <Clock size={16} />,
        action: () => {
          onClose();
          onSelectNav('calendar');
        }
      },
      {
        id: 'nav-classes',
        category: 'NAVIGATION',
        title: t('palette.nav_classes'),
        subtitle: t('palette.nav_classes_sub'),
        icon: <BookOpen size={16} />,
        action: () => {
          onClose();
          onSelectNav('classes');
        }
      },
      {
        id: 'nav-projects',
        category: 'NAVIGATION',
        title: t('palette.nav_projects'),
        subtitle: t('palette.nav_projects_sub'),
        icon: <FolderKanban size={16} />,
        action: () => {
          onClose();
          onSelectNav('projects');
        }
      }
    ];

    // 3. Switch to any workspace
    workspaces.forEach((ws) => {
      let icon = <FolderKanban size={16} />;
      let subtitle = t('workspaces.project');
      if (ws.type === 'PERSONAL') {
        icon = <User size={16} />;
        subtitle = t('workspaces.personal');
      } else if (ws.type === 'SUBJECT') {
        icon = <BookOpen size={16} />;
        subtitle = `${t('workspaces.subject')} [${ws.code || 'MÃ'}]`;
      } else if (ws.type === 'GROUP') {
        icon = <User size={16} />;
        subtitle = t('workspaces.group');
      }

      list.push({
        id: `ws-${ws.id}`,
        category: 'WORKSPACES',
        title: `${t('workspaces.select_workspace')}: ${ws.name}`,
        subtitle: `${subtitle} • ${ws.role === 'OWNER' ? t('projects.role_owner') : t('projects.role_member')}`,
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
    onClose,
    onOpenCreateNote,
    onOpenCreateTask,
    onSelectNav,
    onSelectWorkspace,
    t,
    language,
    toggleLanguage
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
            placeholder={t('palette.placeholder')}
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
            title={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="ws-cmd-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="ws-cmd-empty">
              <span>{t('palette.no_results')}</span>
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
              <kbd>↑</kbd> <kbd>↓</kbd> {language === 'vi' ? 'Di chuyển' : 'Navigate'}
            </span>
            <span>
              <kbd>↵</kbd> {language === 'vi' ? 'Chọn' : 'Select'}
            </span>
            <span>
              <kbd>Esc</kbd> {language === 'vi' ? 'Đóng' : 'Close'}
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

