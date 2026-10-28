import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorkspaceSummary, WorkspaceType } from './types';
import {
  Check,
  Plus,
  Search,
  User,
  GraduationCap,
  FolderGit2
} from 'lucide-react';

interface WorkspaceSwitcherProps {
  currentWorkspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  onSelectWorkspace: (ws: WorkspaceSummary) => void;
  onCreateWorkspace?: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | WorkspaceType>('ALL');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Filtered workspaces
  const filtered = useMemo(() => {
    let list = workspaces;
    if (categoryFilter !== 'ALL') {
      list = list.filter((w) => w.type === categoryFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.subjectCode && w.subjectCode.toLowerCase().includes(q))
    );
  }, [workspaces, search, categoryFilter]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filtered.length) {
      e.preventDefault();
      onSelectWorkspace(filtered[focusedIndex]);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const getWorkspaceTypeIcon = (type: WorkspaceType) => {
    switch (type) {
      case 'PERSONAL':
        return <User size={16} />;
      case 'SUBJECT':
        return <GraduationCap size={16} />;
      case 'PROJECT':
        return <FolderGit2 size={16} />;
    }
  };

  // Get brief monogram for the rail trigger mark
  const getTriggerMonogram = () => {
    if (currentWorkspace.code) {
      return currentWorkspace.code.replace(/[^A-Za-z0-9]/g, '').slice(0, 3);
    }
    return currentWorkspace.name.trim().charAt(0).toUpperCase();
  };

  return (
    <div ref={dropdownRef} className="ws-switcher-rail-wrapper">
      {/* Compact Rail Trigger Icon */}
      <button
        ref={triggerRef}
        type="button"
        className="ws-switcher-rail-btn"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        title={`Không gian hiện tại: ${currentWorkspace.name} (Nhấp để đổi)`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Chuyển đổi không gian làm việc"
      >
        <span className="ws-switcher-monogram">{getTriggerMonogram()}</span>
      </button>

      {/* Floating Tooltip next to Switcher Mark */}
      {!isOpen && (
        <div className="ws-rail-tooltip" role="tooltip">
          <span className="ws-tooltip-text">
            {currentWorkspace.name} {currentWorkspace.code ? `[${currentWorkspace.code}]` : ''}
          </span>
          <span className="ws-tooltip-badge">Đổi</span>
        </div>
      )}

      {/* Flyout Popover Menu to the right of the rail */}
      {isOpen && (
        <div className="ws-switcher-flyout" role="dialog">
          {/* Top Search Bar */}
          <div className="ws-flyout-search-wrap">
            <Search size={14} className="ws-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="ws-flyout-search-input"
              placeholder="Tìm theo tên hoặc mã môn..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Category Filter Pills (Monochrome) */}
          <div className="ws-flyout-tabs">
            <button
              type="button"
              className={`ws-flyout-tab ${categoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('ALL')}
            >
              Tất cả ({workspaces.length})
            </button>
            <button
              type="button"
              className={`ws-flyout-tab ${categoryFilter === 'SUBJECT' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('SUBJECT')}
            >
              Môn học ({workspaces.filter((w) => w.type === 'SUBJECT').length})
            </button>
            <button
              type="button"
              className={`ws-flyout-tab ${categoryFilter === 'PROJECT' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('PROJECT')}
            >
              Đồ án ({workspaces.filter((w) => w.type === 'PROJECT').length})
            </button>
          </div>

          {/* Workspaces List (Monochrome) */}
          <div className="ws-flyout-list" role="listbox">
            {filtered.length === 0 ? (
              <div className="ws-flyout-empty">
                Không tìm thấy không gian phù hợp.
              </div>
            ) : (
              filtered.map((ws, idx) => {
                const isSelected = ws.id === currentWorkspace.id;
                const isFocused = idx === focusedIndex;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    className={`ws-flyout-item ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                    onClick={() => {
                      onSelectWorkspace(ws);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div className="ws-item-monochrome-icon">
                      {getWorkspaceTypeIcon(ws.type)}
                    </div>

                    <div className="ws-item-info">
                      <div className="ws-item-title-row">
                        <span className="ws-item-name">{ws.name}</span>
                        {ws.code && <span className="ws-mono-tag">{ws.code}</span>}
                      </div>
                      <div className="ws-item-sub-row">
                        <span className="ws-role-text">
                          {ws.role === 'OWNER' ? 'Sở hữu' : 'Thành viên'}
                        </span>
                        {ws.memberCount && ws.memberCount > 1 && (
                          <span className="ws-member-text">
                            • {ws.memberCount} thành viên
                          </span>
                        )}
                        {ws.status === 'ARCHIVED' && (
                          <span className="ws-archived-pill">Lưu trữ</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="ws-item-check-icon" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          {onCreateWorkspace && (
            <div className="ws-flyout-footer">
              <button
                type="button"
                className="ws-create-btn"
                onClick={() => {
                  setIsOpen(false);
                  onCreateWorkspace();
                }}
              >
                <Plus size={13} />
                <span>Khởi tạo Không gian mới</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
