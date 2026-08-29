import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { TaskModal } from '../../tasks/components/TaskModal';
import { TaskStatus, TaskPriority } from '@snote/shared';
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
  Layers,
  ChevronDown,
  ChevronRight,
  Circle,
  Flame,
  User,
  Eye
} from 'lucide-react';

export const ProgressDashboardPage: React.FC = () => {
  const { selectedSemesterId, currentSemester, semesters } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<string[]>([]);
  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
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
  }, [selectedSemesterId, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleOpenTaskDetail = (task: any) => {
    setSelectedTaskForModal(task);
    setIsTaskModalOpen(true);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const overallTaskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

  const activeSemesterName = currentSemester
    ? currentSemester.name
    : semesters.find((s) => s.id === selectedSemesterId)?.name || 'Tất cả các học kỳ';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-purple" style={{ fontSize: '11px', padding: '3px 8px' }}>
            Học kỳ: {activeSemesterName}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Sparkles className="animate-spin" size={28} style={{ margin: '0 auto 12px auto' }} />
          <div>Đang tính toán các chỉ số học thuật...</div>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Card 1: Notes Count */}
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
                  Dự Án & Bài Tập Lớn
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

          {/* Breakdown Per Subject Section with Expandable Task Details */}
          <div
            className="snote-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Tiến Độ Chi Tiết Theo Từng Môn Học
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Nhấp vào môn học để xem danh sách nhiệm vụ chi tiết
              </span>
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
                  const isExpanded = expandedSubjectIds.includes(sub.id);

                  return (
                    <div
                      key={sub.id}
                      className="snote-card"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div
                        onClick={() => toggleSubjectExpand(sub.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isExpanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                            {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
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

                      {/* Expandable Tasks List for this Subject */}
                      {isExpanded && (
                        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Danh sách bài tập & công việc môn {sub.name}:
                          </div>

                          {subTasks.length === 0 ? (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                              Chưa có bài tập nào trong môn học này.
                            </div>
                          ) : (
                            subTasks.map((t) => {
                              const isTaskDone = t.status === TaskStatus.DONE;
                              return (
                                <div
                                  key={t.id}
                                  onClick={() => handleOpenTaskDetail(t)}
                                  className="snote-card animate-fade-in"
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    gap: '10px'
                                  }}
                                  title="Nhấp để xem chi tiết công việc"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                    {isTaskDone ? (
                                      <CheckCircle2 size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                    ) : (
                                      <Circle size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    )}
                                    <span
                                      style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: isTaskDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                        textDecoration: isTaskDone ? 'line-through' : 'none',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {t.title}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {t.dueDate && (
                                      <span>
                                        Hạn: {new Date(t.dueDate).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                    <span className={`badge ${t.priority === TaskPriority.URGENT ? 'badge-rose' : t.priority === TaskPriority.HIGH ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                                      {t.priority}
                                    </span>
                                    <Eye size={13} style={{ color: 'var(--color-info)' }} />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dedicated Tasks Action Panel (Click any task to view detail) */}
          <div
            className="snote-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} style={{ color: 'var(--color-success)' }} />
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Nhiệm Vụ Cần Xử Lý & Tiến Độ Nộp Bài ({tasks.filter((t) => t.status !== TaskStatus.DONE).length} việc đang chờ)
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Nhấp trực tiếp vào công việc để xem chi tiết
              </span>
            </div>

            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                Không có công việc nào cần hiển thị
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                {tasks.map((task) => {
                  const isDone = task.status === TaskStatus.DONE;
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleOpenTaskDetail(task)}
                      className="snote-card animate-fade-in"
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all var(--transition-fast)',
                        opacity: isDone ? 0.7 : 1
                      }}
                      title="Nhấp để xem chi tiết công việc"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span className={`badge ${task.priority === TaskPriority.URGENT ? 'badge-rose' : task.priority === TaskPriority.HIGH ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {task.priority}
                        </span>

                        {task.subject && (
                          <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {task.subject.code || task.subject.name}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '13.5px',
                          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          lineHeight: 1.35,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {task.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        </div>
                        <span style={{ color: isDone ? 'var(--color-success)' : 'var(--accent-primary)', fontWeight: 600 }}>
                          {isDone ? 'Đã hoàn thành' : 'Đang làm'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Task Modal for viewing/editing details */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskForModal(null);
        }}
        onSuccess={fetchDashboardData}
        taskToEdit={selectedTaskForModal}
        initialMode="VIEW"
      />
    </div>
  );
};
