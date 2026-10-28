import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorkspaceSummary, WorkspaceType } from './types';
import {
  ChevronDown,
  Check,
  Plus,
  Search,
  User,
  GraduationCap,
  FolderGit2,
  Crown,
  Shield,
  Users,
  Compass
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
        return <User size={15} />;
      case 'SUBJECT':
        return <GraduationCap size={15} />;
      case 'PROJECT':
        return <FolderGit2 size={15} />;
    }
  };

  const getRoleTag = (role: string) => {
    if (role === 'OWNER') return <span className="ws-role-pill owner" title="Chủ sở hữu"><Crown size={11} /> Sở hữu</span>;
    if (role === 'MANAGER') return <span className="ws-role-pill manager" title="Quản lý"><Shield size={11} /> Quản lý</span>;
    return <span className="ws-role-pill member" title="Thành viên"><Users size={11} /> Thành viên</span>;
  };

  return (
    <div ref={dropdownRef} className="ws-switcher-wrapper">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className="ws-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Chuyển đổi không gian làm việc"
      >
        <div className={`ws-switcher-type-mark ${currentWorkspace.type.toLowerCase()}`}>
          {getWorkspaceTypeIcon(currentWorkspace.type)}
        </div>

        <div className="ws-switcher-text-block">
          <div className="ws-switcher-active-name">{currentWorkspace.name}</div>
          <div className="ws-switcher-sub-meta">
            {currentWorkspace.code && (
              <span className="ws-academic-code">{currentWorkspace.code}</span>
            )}
            <span className="ws-type-name">
              {currentWorkspace.type === 'PERSONAL'
                ? 'Không gian cá nhân'
                : currentWorkspace.type === 'SUBJECT'
                ? 'Môn học'
                : 'Đồ án nhóm'}
            </span>
          </div>
        </div>

        <ChevronDown
          size={14}
          className={`ws-switcher-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Switcher Dropdown Popover */}
      {isOpen && (
        <div className="ws-switcher-popover" role="dialog">
          {/* Top Search & Filter Bar */}
          <div className="ws-popover-search-wrap">
            <Search size={14} className="ws-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="ws-popover-search-input"
              placeholder="Tìm theo tên môn, mã học phần (INT)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Category Tabs */}
          <div className="ws-category-tabs">
            <button
              type="button"
              className={`ws-cat-tab ${categoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('ALL')}
            >
              Tất cả ({workspaces.length})
            </button>
            <button
              type="button"
              className={`ws-cat-tab ${categoryFilter === 'SUBJECT' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('SUBJECT')}
            >
              Môn học ({workspaces.filter((w) => w.type === 'SUBJECT').length})
            </button>
            <button
              type="button"
              className={`ws-cat-tab ${categoryFilter === 'PROJECT' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('PROJECT')}
            >
              Đồ án ({workspaces.filter((w) => w.type === 'PROJECT').length})
            </button>
          </div>

          {/* Workspaces List */}
          <div className="ws-popover-list" role="listbox">
            {filtered.length === 0 ? (
              <div className="ws-popover-empty">
                Không tìm thấy không gian làm việc phù hợp.
              </div>
            ) : (
              filtered.map((ws, idx) => {
                const isSelected = ws.id === currentWorkspace.id;
                const isFocused = idx === focusedIndex;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    className={`ws-popover-item ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                    onClick={() => {
                      onSelectWorkspace(ws);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div className={`ws-item-type-icon ${ws.type.toLowerCase()}`}>
                      {getWorkspaceTypeIcon(ws.type)}
                    </div>

                    <div className="ws-item-content">
                      <div className="ws-item-top-row">
                        <span className="ws-item-title">{ws.name}</span>
                        {ws.code && <span className="ws-academic-code-mono">{ws.code}</span>}
                      </div>
                      <div className="ws-item-meta-row">
                        {getRoleTag(ws.role)}
                        {ws.memberCount && ws.memberCount > 1 && (
                          <span className="ws-item-members-count">
                            {ws.memberCount} thành viên
                          </span>
                        )}
                        {ws.status === 'ARCHIVED' && (
                          <span className="ws-archived-tag">Đã lưu trữ</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="ws-item-check" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          {onCreateWorkspace && (
            <div className="ws-popover-footer">
              <button
                type="button"
                className="ws-create-ws-btn"
                onClick={() => {
                  setIsOpen(false);
                  onCreateWorkspace();
                }}
              >
                <Plus size={14} />
                <span>Khởi tạo Không gian mới</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
