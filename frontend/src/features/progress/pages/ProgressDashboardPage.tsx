import React, { useState, useEffect } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { TaskStatus } from '@snote/shared';

export const ProgressDashboardPage: React.FC = () => {
  const { selectedSemesterId, currentSemester } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const semQuery = selectedSemesterId ? `?semesterId=${selectedSemesterId}` : '';
        const [notesRes, tasksRes, subsRes, projsRes] = await Promise.all([
          api.get<ApiResponse<any[]>>(`/notes`),
          api.get<ApiResponse<any[]>>(`/tasks`),
          api.get<ApiResponse<any[]>>(`/subjects${semQuery}`),
          api.get<ApiResponse<any[]>>(`/projects${semQuery}`)
        ]);

        setNotes(notesRes.data || []);
        setTasks(tasksRes.data || []);
        setSubjects(subsRes.data || []);
        setProjects(projsRes.data || []);
      } catch {
        showToast('Không thể tải dữ liệu tiến độ', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedSemesterId, showToast]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
  const overallTaskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          📊 Tổng Quan Tiến Độ Học Tập
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
          {currentSemester ? `Đang xem: ${currentSemester.name}` : 'Thống kê tổng hợp toàn bộ các học kỳ'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Đang tổng hợp số liệu học tập...
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Card 1: Notes */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tổng Ghi Chú</span>
                <span style={{ fontSize: '20px' }}>📚</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{notes.length}</div>
              <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '6px', fontWeight: 600 }}>Bài giảng đã lưu trữ</div>
            </div>

            {/* Card 2: Tasks Completion */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiến Độ Hoàn Thành</span>
                <span style={{ fontSize: '20px' }}>✅</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {overallTaskPercentage}%
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
                {completedTasks} / {totalTasks} bài tập đã nộp
              </div>
            </div>

            {/* Card 3: Credits */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tín Chỉ Học Tập</span>
                <span style={{ fontSize: '20px' }}>🎓</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCredits}</div>
              <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
                {subjects.length} môn học trong kỳ
              </div>
            </div>

            {/* Card 4: Projects */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Đồ Án Môn Học</span>
                <span style={{ fontSize: '20px' }}>🛠️</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{projects.length}</div>
              <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '6px', fontWeight: 600 }}>Dự án đang theo dõi</div>
            </div>
          </div>

          {/* Breakdown Per Subject */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
              🎯 Tiến Độ Chi Tiết Theo Từng Môn Học
            </h2>

            {subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                Chưa có môn học nào để phân tích tiến độ
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {subjects.map((sub) => {
                  const subTasks = tasks.filter((t) => t.subjectId === sub.id);
                  const subDone = subTasks.filter((t) => t.status === TaskStatus.DONE).length;
                  const subPercent = subTasks.length > 0 ? Math.round((subDone / subTasks.length) * 100) : 0;
                  const subNotes = notes.filter((n) => n.subjectId === sub.id).length;

                  return (
                    <div
                      key={sub.id}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '16px 20px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                            ({sub.credits} Tín chỉ &nbsp;•&nbsp; 📝 {subNotes} Notes)
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: subPercent === 100 ? '#10b981' : 'var(--accent-primary)' }}>
                          {subDone} / {subTasks.length} Tasks ({subPercent}%)
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${subPercent}%`,
                            height: '100%',
                            backgroundColor: subPercent === 100 ? '#10b981' : (sub.color || 'var(--accent-primary)'),
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
