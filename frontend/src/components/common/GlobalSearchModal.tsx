import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiResponse } from '../../services/api';
import { useAppFilter } from '../../contexts/AppFilterContext';
import {
  Search,
  X,
  FileText,
  CheckSquare,
  FolderKanban,
  Calendar,
  Sparkles,
  BookOpen,
  Tag,
  ArrowRight,
  Filter,
  Flame,
  Clock,
  Pin
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNoteDetail?: (noteId: string) => void;
  onOpenTaskDetail?: (taskId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenNoteDetail,
  onOpenTaskDetail
}) => {
  const navigate = useNavigate();
  const { subjects, semesters } = useAppFilter();

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL'); // ALL, notes, tasks, projects, schedule
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isPinnedOnly, setIsPinnedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<any>({
    notes: [],
    tasks: [],
    projects: [],
    scheduleEvents: [],
    totalCount: 0
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ notes: [], tasks: [], projects: [], scheduleEvents: [], totalCount: 0 });
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (selectedType !== 'ALL') params.append('itemTypes', selectedType);
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedStatus) params.append('status', selectedStatus);
      if (isPinnedOnly) params.append('isPinned', 'true');

      const res = await api.get<ApiResponse<any>>(`/search?${params.toString()}`);
      setResults(res.data || { notes: [], tasks: [], projects: [], scheduleEvents: [], totalCount: 0 });
    } catch {
      // Ignore abort/network errors in search bar
    } finally {
      setLoading(false);
    }
  }, [isOpen, query, selectedType, selectedSubjectId, selectedPriority, selectedStatus, isPinnedOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 200);
    return () => clearTimeout(timer);
  }, [performSearch]);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (item: any) => {
    onClose();
    if (item.type === 'NOTE') {
      if (onOpenNoteDetail) {
        onOpenNoteDetail(item.id);
      } else {
        navigate(`/notes?noteId=${item.id}`);
      }
    } else if (item.type === 'TASK') {
      if (onOpenTaskDetail) {
        onOpenTaskDetail(item.id);
      } else {
        navigate(`/tasks?taskId=${item.id}`);
      }
    } else if (item.type === 'PROJECT') {
      navigate('/projects');
    } else if (item.type === 'SCHEDULE_EVENT') {
      navigate('/schedule');
    }
  };

  const allItems = [
    ...results.notes,
    ...results.tasks,
    ...results.projects,
    ...results.scheduleEvents
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 40px 16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="snote-card"
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '82vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Search Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <Search size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm mọi thứ trong SNOTE: Ghi chú, Bài tập, Đồ án, Tiết học..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15.5px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ padding: 0 }}
            >
              <X size={16} />
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '12px', fontWeight: 600, gap: '4px', padding: '5px 10px' }}
          >
            <Filter size={13} />
            <span>Bộ lọc</span>
          </button>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            ESC
          </span>
        </div>

        {/* 2. Filter Bar (Expandable) */}
        {showFilters && (
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              fontSize: '12px'
            }}
          >
            {/* Subject filter */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="snote-select"
              style={{ fontSize: '12px', padding: '4px 8px', height: '30px' }}
            >
              <option value="">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code || 'MÔN'}] {s.name}
                </option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="snote-select"
              style={{ fontSize: '12px', padding: '4px 8px', height: '30px' }}
            >
              <option value="">Tất cả mức ưu tiên</option>
              <option value="URGENT">🔴 Khẩn cấp</option>
              <option value="HIGH">🟠 Cao</option>
              <option value="MEDIUM">🟡 Trung bình</option>
              <option value="LOW">🟢 Thấp</option>
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="snote-select"
              style={{ fontSize: '12px', padding: '4px 8px', height: '30px' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="TODO">Cần làm</option>
              <option value="IN_PROGRESS">Đang thực hiện</option>
              <option value="DONE">Đã hoàn thành</option>
            </select>

            {/* Pinned toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={isPinnedOnly}
                onChange={(e) => setIsPinnedOnly(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <Pin size={12} />
              <span>Chỉ mục đã ghim</span>
            </label>
          </div>
        )}

        {/* 3. Category Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'ALL', label: 'Tất cả kết quả', count: results.totalCount },
            { id: 'notes', label: 'Ghi chú', count: results.notes.length, icon: FileText },
            { id: 'tasks', label: 'Công việc', count: results.tasks.length, icon: CheckSquare },
            { id: 'projects', label: 'Đồ án nhóm', count: results.projects.length, icon: FolderKanban },
            { id: 'schedule', label: 'Lịch học', count: results.scheduleEvents.length, icon: Calendar }
          ].map((tab) => {
            const isSelected = selectedType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {Icon && <Icon size={13} />}
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Search Results Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Sparkles className="animate-spin" size={20} style={{ margin: '0 auto 8px auto', color: 'var(--accent-primary)' }} />
              <div>Đang tìm kiếm dữ liệu...</div>
            </div>
          ) : allItems.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
              {query.trim() ? `Không tìm thấy kết quả nào phù hợp với "${query}"` : 'Nhập từ khóa để bắt đầu tìm kiếm nhanh'}
            </div>
          ) : (
            allItems.map((item) => {
              const iconMap: Record<string, any> = {
                NOTE: FileText,
                TASK: CheckSquare,
                PROJECT: FolderKanban,
                SCHEDULE_EVENT: Calendar
              };
              const colorMap: Record<string, string> = {
                NOTE: 'var(--accent-primary)',
                TASK: '#f59e0b',
                PROJECT: '#a855f7',
                SCHEDULE_EVENT: '#10b981'
              };
              const typeLabelMap: Record<string, string> = {
                NOTE: 'Ghi chú',
                TASK: 'Công việc',
                PROJECT: 'Đồ án',
                SCHEDULE_EVENT: 'Lịch học'
              };

              const ItemIcon = iconMap[item.type] || FileText;
              const typeColor = colorMap[item.type] || 'var(--accent-primary)';

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="snote-card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: `${typeColor}20`,
                        color: typeColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ItemIcon size={16} />
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: `${typeColor}20`,
                            color: typeColor
                          }}
                        >
                          {typeLabelMap[item.type]}
                        </span>

                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.title}
                        </span>

                        {item.isPinned && <Pin size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                      </div>

                      {item.snippet && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.snippet}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Tags / Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {item.subject && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          color: item.subject.color || 'var(--color-info)',
                          fontWeight: 600
                        }}
                      >
                        {item.subject.code ? `[${item.subject.code}] ` : ''}{item.subject.name}
                      </span>
                    )}

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString('vi-VN')}
                    </span>

                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
