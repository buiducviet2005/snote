import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProjectModal } from '../components/ProjectModal';
import { ProjectStatus } from '@snote/shared';

export const ProjectsListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const { showToast } = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedSemesterId) params.append('semesterId', selectedSemesterId);

      const res = await api.get<ApiResponse<any[]>>(`/projects?${params.toString()}`);
      setProjects(res.data || []);
    } catch {
      showToast('Không thể tải danh sách đồ án', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, selectedSemesterId, showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đồ án "${name}" không?`)) return;

    try {
      await api.delete(`/projects/${id}`);
      showToast(`Đã xóa đồ án "${name}"`, 'success');
      fetchProjects();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa đồ án', 'error');
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return { label: 'Đang làm', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case ProjectStatus.COMPLETED:
        return { label: 'Hoàn thành', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
      case ProjectStatus.ON_HOLD:
        return { label: 'Tạm hoãn', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
      default:
        return { label: 'Lên kế hoạch', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            🛠️ Quản Lý Đồ Án & Dự Án Môn Học
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Theo dõi các đề tài nghiên cứu, đồ án tốt nghiệp và bài tập lớn
          </p>
        </div>
        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          style={{
            padding: '11px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
          }}
        >
          + Thêm Đồ Án Mới
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Đang tải danh sách đồ án...
        </div>
      ) : projects.length === 0 ? (
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
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛠️</div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Chưa có đồ án nào</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            Tạo đồ án môn học để liên kết các ghi chú kỹ thuật và công việc nhóm.
          </p>
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
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
            + Tạo Đồ Án Đầu Tiên
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {projects.map((proj) => {
            const badge = getStatusBadge(proj.status);
            return (
              <div
                key={proj.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {badge.label}
                    </span>
                    {proj.dueDate && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Deadline: {new Date(proj.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {proj.name}
                  </h3>

                  {proj.description && (
                    <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {proj.description}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div>
                    📝 <b>{proj.notesCount || 0}</b> Notes &nbsp;•&nbsp; ✅ <b>{proj.tasksCount || 0}</b> Tasks
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setProjectToEdit(proj);
                        setIsModalOpen(true);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id, proj.name)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
