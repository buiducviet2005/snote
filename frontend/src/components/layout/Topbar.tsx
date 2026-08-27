import React from 'react';
import { useAppFilter } from '../../contexts/AppFilterContext';

export const Topbar: React.FC = () => {
  const {
    selectedSemesterId,
    selectedSubjectId,
    setSelectedSemesterId,
    setSelectedSubjectId,
    semesters,
    subjects
  } = useAppFilter();

  const filteredSubjects = selectedSemesterId
    ? subjects.filter((s) => s.semesterId === selectedSemesterId)
    : subjects;

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Context Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Ngữ cảnh:
        </span>

        {/* Học kỳ Selector */}
        <select
          value={selectedSemesterId || ''}
          onChange={(e) => setSelectedSemesterId(e.target.value || null)}
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">Tất cả học kỳ</option>
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.name} {sem.isCurrent ? '(Hiện tại)' : ''}
            </option>
          ))}
        </select>

        {/* Môn học Selector */}
        <select
          value={selectedSubjectId || ''}
          onChange={(e) => setSelectedSubjectId(e.target.value || null)}
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none'
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
      </div>

      {/* Quick Action Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {selectedSubjectId && (
          <button
            onClick={() => setSelectedSubjectId(null)}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--accent-primary)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ✕ Bỏ lọc môn
          </button>
        )}
      </div>
    </header>
  );
};
