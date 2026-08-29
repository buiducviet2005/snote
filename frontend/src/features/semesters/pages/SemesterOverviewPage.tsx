import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { SemesterModal } from '../components/SemesterModal';
import { SubjectModal } from '../components/SubjectModal';
import {
  Layers,
  BookOpen,
  Plus,
  Trash2,
  User,
  Award,
  CheckSquare,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';

export const SemesterOverviewPage: React.FC = () => {
  const { selectedSemesterId, setSelectedSemesterId, semesters, refreshFilterData } = useAppFilter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedSemesterId ? `/subjects?semesterId=${selectedSemesterId}` : '/subjects';
      const res = await api.get<ApiResponse<any[]>>(url);
      setSubjects(res.data || []);
    } catch {
      showToast('Không thể tải danh sách môn học', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, showToast]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa môn học "${name}" không?`)) return;

    try {
      await api.delete(`/subjects/${id}`);
      showToast(`Đã xóa môn học "${name}"`, 'success');
      await refreshFilterData();
      fetchSubjects();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa môn học', 'error');
    }
  };

  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
  const currentSemesterObj = semesters.find((s) => s.id === selectedSemesterId);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-purple" style={{ fontSize: '11px', padding: '3px 8px' }}>
            {subjects.length} Môn học ({totalCredits} Tín chỉ)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsSemesterModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600, padding: '7px 12px' }}
          >
            <Plus size={14} />
            <span>Thêm Học Kỳ</span>
          </button>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700, padding: '7px 14px' }}
          >
            <Plus size={14} />
            <span>Thêm Môn Học</span>
          </button>
        </div>
      </div>

      {/* Semester Selection Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedSemesterId(null)}
          className={`btn ${selectedSemesterId === null ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Layers size={14} />
          <span>Tất cả học kỳ</span>
        </button>

        {semesters.map((sem) => {
          const isSelected = selectedSemesterId === sem.id;
          return (
            <button
              key={sem.id}
              onClick={() => setSelectedSemesterId(sem.id)}
              className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{sem.name}</span>
              {sem.isCurrent && (
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--accent-primary)',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải danh sách môn học...</span>
          </div>
        </div>
      ) : subjects.length === 0 ? (
        <div
          className="snote-card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-secondary)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <BookOpen size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Chưa có môn học nào trong học kỳ này
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Môn học là trục liên kết bắt buộc giúp ghi chú và bài tập được phân loại khoa học.
          </p>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Thêm Môn Học Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {subjects.map((sub) => {
            const subColor = sub.color || 'var(--accent-primary)';
            return (
              <div
                key={sub.id}
                className="snote-card animate-fade-in"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderTop: `4px solid ${subColor}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${subColor}18`,
                        color: subColor,
                        border: `1px solid ${subColor}35`,
                        fontWeight: 700
                      }}
                    >
                      {sub.code || 'CODE'}
                    </span>
                    <span className="badge badge-neutral">
                      <Award size={11} />
                      <span>{sub.credits} Tín chỉ</span>
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                    {sub.name}
                  </h3>

                  {sub.lecturer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{sub.lecturer}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={12} />
                      <b>{sub.notesCount || 0}</b> ghi chú
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckSquare size={12} />
                      <b>{sub.tasksCount || 0}</b> việc
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSubject(sub.id, sub.name)}
                    className="btn btn-ghost btn-icon"
                    style={{ color: 'var(--color-danger)', padding: '4px' }}
                    title="Xóa môn học"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SemesterModal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        onSuccess={() => {}}
      />
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSuccess={fetchSubjects}
        defaultSemesterId={selectedSemesterId}
      />
    </div>
  );
};
