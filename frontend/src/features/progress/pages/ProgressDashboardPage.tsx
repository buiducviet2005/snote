import React, { useState, useEffect } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { TaskStatus } from '@snote/shared';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  GraduationCap,
  FolderKanban,
  Award,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

export const ProgressDashboardPage: React.FC = () => {
  const { selectedSemesterId, currentSemester, semesters } = useAppFilter();
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
        showToast('Không thể tải dữ liệu thống kê tiến độ', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedSemesterId, showToast]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const overallTaskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  const activeSemesterName = currentSemester
    ? currentSemester.name
    : semesters.find((s) => s.id === selectedSemesterId)?.name || 'Tất cả các học kỳ';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Tổng Quan Tiến Độ Học Tập
          </h1>
          <span className="badge badge-purple">
            {activeSemesterName}
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Thống kê toàn diện về khối lượng ghi chú, năng suất hoàn thành bài tập và phân bổ tín chỉ
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang phân tích và tổng hợp số liệu học tập...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Top 4 Bento Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Card 1: Notes */}
            <div
              className="snote-card animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tổng Bài Ghi Chú
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-info-subtle)',
                    color: 'var(--color-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <BookOpen size={18} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {notes.length}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-info)', marginTop: '8px', fontWeight: 600 }}>
                Bài giảng & Đề cương lưu trữ
              </div>
            </div>

            {/* Card 2: Tasks Completion Rate */}
            <div
              className="snote-card animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tỷ Lệ Hoàn Thành
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-success-subtle)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {overallTaskPercentage}%
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-success)', marginTop: '8px', fontWeight: 600 }}>
                {completedTasks} / {totalTasks} bài tập đã nộp
              </div>
            </div>

            {/* Card 3: Academic Credits */}
            <div
              className="snote-card animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tín Chỉ Học Tập
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-warning-subtle)',
                    color: 'var(--color-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Award size={18} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {totalCredits}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-warning)', marginTop: '8px', fontWeight: 600 }}>
                {subjects.length} môn học trong kỳ
              </div>
            </div>

            {/* Card 4: Projects */}
            <div
              className="snote-card animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Đồ Án & Nghiên Cứu
                </span>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-purple-subtle)',
                    color: 'var(--color-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FolderKanban size={18} />
                </div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {projects.length}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--color-purple)', marginTop: '8px', fontWeight: 600 }}>
                Đề tài đang triển khai
              </div>
            </div>
          </div>

          {/* Breakdown Per Subject Section */}
          <div
            className="snote-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-xl)',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Tiến Độ Chi Tiết Theo Từng Môn Học
              </h2>
            </div>

            {subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                Chưa có môn học nào để phân tích dữ liệu
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {subjects.map((sub) => {
                  const subTasks = tasks.filter((t) => t.subjectId === sub.id);
                  const subDone = subTasks.filter((t) => t.status === TaskStatus.DONE).length;
                  const subPercent = subTasks.length > 0 ? Math.round((subDone / subTasks.length) * 100) : 0;
                  const subNotes = notes.filter((n) => n.subjectId === sub.id).length;
                  const subColor = sub.color || 'var(--accent-primary)';

                  return (
                    <div
                      key={sub.id}
                      className="snote-card"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                            ({sub.credits} Tín chỉ &nbsp;•&nbsp; 📝 {subNotes} Bài ghi)
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: subPercent === 100 ? 'var(--color-success)' : 'var(--accent-primary)'
                          }}
                        >
                          {subDone} / {subTasks.length} Bài tập ({subPercent}%)
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${subPercent}%`,
                            height: '100%',
                            backgroundColor: subPercent === 100 ? 'var(--color-success)' : subColor,
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
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
