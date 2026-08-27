import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { SemesterModal } from '../components/SemesterModal';
import { SubjectModal } from '../components/SubjectModal';

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            📁 Quản lý Học Kỳ & Môn Học
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Trục tổ chức kiến thức trọng tâm của sinh viên (Anti-Junk Context)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsSemesterModalOpen(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Thêm Học Kỳ
          </button>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Thêm Môn Học
          </button>
        </div>
      </div>

      {/* Semester Tabs */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedSemesterId(null)}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: selectedSemesterId === null ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
            background: selectedSemesterId === null ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
            color: selectedSemesterId === null ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Tất cả học kỳ
        </button>
        {semesters.map((sem) => (
          <button
            key={sem.id}
            onClick={() => setSelectedSemesterId(sem.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: selectedSemesterId === sem.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: selectedSemesterId === sem.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)',
              color: selectedSemesterId === sem.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{sem.name}</span>
            {sem.isCurrent && (
              <span style={{ fontSize: '10px', background: 'var(--accent-primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                Active
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Đang tải danh sách môn học...
        </div>
      ) : subjects.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: '16px',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📖</div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Chưa có môn học nào trong học kỳ này</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            Môn học là trục gắn kết ghi chú và công việc để tránh tạo rác dữ liệu.
          </p>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Thêm Môn Học Đầu Tiên
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {subjects.map((sub) => (
            <div
              key={sub.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderTop: `4px solid ${sub.color || 'var(--accent-primary)'}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {sub.code || 'NO-CODE'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {sub.credits} Tín chỉ
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {sub.name}
                </h3>
                {sub.lecturer && (
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    👨‍🏫 {sub.lecturer}
                  </p>
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
                  color: 'var(--text-secondary)'
                }}
              >
                <div>
                  📝 <b>{sub.notesCount || 0}</b> Ghi chú &nbsp;•&nbsp; ✅ <b>{sub.tasksCount || 0}</b> Việc
                </div>
                <button
                  onClick={() => handleDeleteSubject(sub.id, sub.name)}
                  title="Xóa môn học"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
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
