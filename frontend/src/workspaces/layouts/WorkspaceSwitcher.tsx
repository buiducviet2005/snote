import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorkspaceSummary, WorkspaceType } from './types';
import {
  ChevronDown,
  Check,
  Plus,
  Search,
  User,
  BookOpen,
  FolderKanban,
  Crown,
  Shield,
  Users
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
    const q = search.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.subjectCode && w.subjectCode.toLowerCase().includes(q))
    );
  }, [workspaces, search]);

  const personals = useMemo(() => filtered.filter((w) => w.type === 'PERSONAL'), [filtered]);
  const subjects = useMemo(() => filtered.filter((w) => w.type === 'SUBJECT'), [filtered]);
  const projects = useMemo(() => filtered.filter((w) => w.type === 'PROJECT'), [filtered]);

  const flattenedList = useMemo(() => [...personals, ...subjects, ...projects], [personals, subjects, projects]);

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
      setFocusedIndex((prev) => (prev < flattenedList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : flattenedList.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < flattenedList.length) {
      e.preventDefault();
      onSelectWorkspace(flattenedList[focusedIndex]);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const getWorkspaceIcon = (type: WorkspaceType) => {
    switch (type) {
      case 'PERSONAL':
        return <User size={16} />;
      case 'SUBJECT':
        return <BookOpen size={16} />;
      case 'PROJECT':
        return <FolderKanban size={16} />;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'OWNER') return <span title="Chủ sở hữu" style={{ color: '#d97706', display: 'flex' }}><Crown size={12} /></span>;
    if (role === 'MANAGER') return <span title="Quản lý" style={{ color: '#2563eb', display: 'flex' }}><Shield size={12} /></span>;
    return <span title="Thành viên" style={{ color: 'var(--text-muted)', display: 'flex' }}><Users size={12} /></span>;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Switcher Button Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="ws-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Nhấp để chuyển đổi không gian làm việc"
      >
        <div
          className="ws-switcher-icon"
          style={{
            backgroundColor:
              currentWorkspace.type === 'PERSONAL'
                ? 'rgba(59, 130, 246, 0.12)'
                : currentWorkspace.type === 'SUBJECT'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(168, 85, 247, 0.12)',
            color:
              currentWorkspace.type === 'PERSONAL'
                ? '#2563eb'
                : currentWorkspace.type === 'SUBJECT'
                ? '#059669'
                : '#7c3aed'
          }}
        >
          {getWorkspaceIcon(currentWorkspace.type)}
        </div>

        <div className="ws-switcher-meta">
          <div className="ws-switcher-name">{currentWorkspace.name}</div>
          <div className="ws-switcher-badge">
            <span>
              {currentWorkspace.type === 'PERSONAL'
                ? 'Cá nhân'
                : currentWorkspace.type === 'SUBJECT'
                ? `Môn [${currentWorkspace.code || 'Học'}]`
                : 'Dự án / BTL'}
            </span>
            <span>•</span>
            {getRoleBadge(currentWorkspace.role)}
          </div>
        </div>

        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease'
          }}
        />
      </button>

      {/* Switcher Popover Menu */}
      {isOpen && (
        <div className="ws-switcher-dropdown">
          {/* Quick Search Input */}
          <div className="ws-switcher-search">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm không gian (Tên, mã môn)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ paddingLeft: '28px' }}
              />
            </div>
          </div>

          {/* Grouped Lists */}
          <div className="ws-switcher-list" role="listbox">
            {flattenedList.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                Không tìm thấy không gian phù hợp
              </div>
            ) : (
              <>
                {/* 1. Personal Workspace */}
                {personals.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div className="ws-group-title">
                      <span>Cá nhân</span>
                      <span>{personals.length}</span>
                    </div>
                    {personals.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        className={`ws-item-btn ${ws.id === currentWorkspace.id ? 'active' : ''}`}
                        onClick={() => {
                          onSelectWorkspace(ws);
                          setIsOpen(false);
                        }}
                      >
                        <User size={14} style={{ color: '#2563eb' }} />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                          {ws.name}
                        </span>
                        {ws.id === currentWorkspace.id && <Check size={14} style={{ color: '#2563eb' }} />}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Subject Workspaces */}
                {subjects.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div className="ws-group-title">
                      <span>Môn học đang theo</span>
                      <span>{subjects.length}</span>
                    </div>
                    {subjects.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        className={`ws-item-btn ${ws.id === currentWorkspace.id ? 'active' : ''}`}
                        onClick={() => {
                          onSelectWorkspace(ws);
                          setIsOpen(false);
                        }}
                      >
                        <BookOpen size={14} style={{ color: '#059669' }} />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                          {ws.code ? `[${ws.code}] ` : ''}{ws.name}
                        </span>
                        {getRoleBadge(ws.role)}
                        {ws.id === currentWorkspace.id && <Check size={14} style={{ color: '#059669', marginLeft: '4px' }} />}
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. Project Workspaces */}
                {projects.length > 0 && (
                  <div>
                    <div className="ws-group-title">
                      <span>Dự án & Đồ án nhóm</span>
                      <span>{projects.length}</span>
                    </div>
                    {projects.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        className={`ws-item-btn ${ws.id === currentWorkspace.id ? 'active' : ''}`}
                        onClick={() => {
                          onSelectWorkspace(ws);
                          setIsOpen(false);
                        }}
                      >
                        <FolderKanban size={14} style={{ color: '#7c3aed' }} />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                          {ws.name}
                        </span>
                        {getRoleBadge(ws.role)}
                        {ws.id === currentWorkspace.id && <Check size={14} style={{ color: '#7c3aed', marginLeft: '4px' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Switcher Footer */}
          {onCreateWorkspace && (
            <div className="ws-switcher-footer">
              <button
                type="button"
                className="ws-new-btn"
                onClick={() => {
                  setIsOpen(false);
                  onCreateWorkspace();
                }}
              >
                <Plus size={14} />
                <span>Tạo không gian làm việc mới</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
