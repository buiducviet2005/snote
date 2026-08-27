import React, { useState } from 'react';
import { useAppFilter } from '../../contexts/AppFilterContext';
import { useNavigate } from 'react-router-dom';
import { QuickActionModal } from '../common/QuickActionModal';
import { NoteModal } from '../../features/notes/components/NoteModal';
import { TaskModal } from '../../features/tasks/components/TaskModal';
import { EventModal } from '../../features/schedule/components/EventModal';
import {
  Layers,
  BookOpen,
  X,
  Plus,
  Sparkles,
  ChevronDown,
  Clock
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    selectedSemesterId,
    selectedSubjectId,
    setSelectedSemesterId,
    setSelectedSubjectId,
    semesters,
    subjects
  } = useAppFilter();

  const navigate = useNavigate();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const filteredSubjects = selectedSemesterId
    ? subjects.filter((s) => s.semesterId === selectedSemesterId)
    : subjects;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleSelectQuickAction = (action: 'NOTE' | 'TASK' | 'EVENT') => {
    if (action === 'NOTE') setIsNoteModalOpen(true);
    if (action === 'TASK') setIsTaskModalOpen(true);
    if (action === 'EVENT') setIsEventModalOpen(true);
  };

  return (
    <>
      <header
        className="glass-panel"
        style={{
          height: '68px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        {/* Context Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
            <Layers size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Ngữ cảnh:</span>
          </div>

          {/* Học kỳ Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSemesterId || ''}
              onChange={(e) => setSelectedSemesterId(e.target.value || null)}
              className="snote-select"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '7px 32px 7px 12px',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '150px'
              }}
            >
              <option value="">Tất cả học kỳ</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.name} {sem.isCurrent ? '⚡ (Hiện tại)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          {/* Môn học Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSubjectId || ''}
              onChange={(e) => setSelectedSubjectId(e.target.value || null)}
              className="snote-select"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '7px 32px 7px 12px',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '180px',
                borderColor: currentSubject?.color ? currentSubject.color : 'var(--border-color)'
              }}
            >
              <option value="">Tất cả môn học</option>
              {filteredSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}
                  {sub.name} ({sub.credits} TC)
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          {/* Quick Clear Subject Filter */}
          {selectedSubjectId && (
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="badge badge-blue"
              style={{ cursor: 'pointer', border: 'none', padding: '6px 10px' }}
              title="Bỏ lọc theo môn"
            >
              <X size={12} />
              <span>Bỏ lọc</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Quick Action Button */}
          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              gap: '6px'
            }}
          >
            <Plus size={16} />
            <span>Tạo Nhanh</span>
          </button>
        </div>
      </header>

      {/* Global Quick Action Selector Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />

      {/* Quick Creation Modals */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSuccess={() => navigate('/notes')}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => navigate('/tasks')}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSuccess={() => navigate('/schedule')}
      />
    </>
  );
};
