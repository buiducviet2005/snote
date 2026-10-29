import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TaskModal } from '../../tasks/components/TaskModal';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  BarChart3,
  FileText,
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
  const { t, formatDate } = useLanguage();
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
      showToast(t('progress.load_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSemesterId, showToast, t]);

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
    : semesters.find((s) => s.id === selectedSemesterId)?.name || t('progress.all_semesters');

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-purple" style={{ fontSize: 'var(--type-caption)', padding: '3px 8px' }}>
            {t('progress.semester_badge', { name: activeSemesterName })}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Sparkles className="animate-spin" size={28} style={{ margin: '0 auto 12px auto' }} />
          <div>{t('progress.loading')}</div>
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
                <span style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('progress.kpi_notes')}
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
                  <FileText size={18} />
                </div>
              </div>
              <div style={{ fontSize: 'var(--type-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {notes.length}
              </div>
              <div style={{ fontSize: 'var(--type-small)', color: 'var(--color-info)', marginTop: '8px', fontWeight: 600 }}>
                {t('progress.kpi_notes_desc')}
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
                <span style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('progress.kpi_completion')}
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
              <div style={{ fontSize: 'var(--type-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {overallTaskPercentage}%
              </div>
              <div style={{ fontSize: 'var(--type-small)', color: 'var(--color-success)', marginTop: '8px', fontWeight: 600 }}>
                {t('progress.kpi_completion_desc', { completed: completedTasks, total: totalTasks })}
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
                <span style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('progress.kpi_credits')}
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
              <div style={{ fontSize: 'var(--type-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {totalCredits}
              </div>
              <div style={{ fontSize: 'var(--type-small)', color: 'var(--color-warning)', marginTop: '8px', fontWeight: 600 }}>
                {t('progress.kpi_credits_desc', { count: subjects.length })}
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
                <span style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('progress.kpi_projects')}
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
              <div style={{ fontSize: 'var(--type-display)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {projects.length}
              </div>
              <div style={{ fontSize: 'var(--type-small)', color: 'var(--color-purple)', marginTop: '8px', fontWeight: 600 }}>
                {t('progress.kpi_projects_desc')}
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
                <h2 style={{ fontSize: 'var(--type-section)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {t('progress.subject_breakdown_title')}
                </h2>
              </div>
              <span style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)' }}>
                {t('progress.subject_breakdown_hint')}
              </span>
            </div>

            {subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                {t('progress.no_subjects')}
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
                          <span style={{ fontWeight: 700, fontSize: 'var(--type-body)', color: 'var(--text-primary)' }}>
                            {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                          </span>
                          <span style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            {t('progress.subject_meta', { credits: sub.credits, notes: subNotes })}
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 'var(--type-small)',
                            color: subPercent === 100 ? 'var(--color-success)' : 'var(--accent-primary)'
                          }}
                        >
                          {t('progress.subject_task_ratio', { done: subDone, total: subTasks.length, percent: subPercent })}
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
                          <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {t('progress.subject_task_list_title', { name: sub.name })}
                          </div>

                          {subTasks.length === 0 ? (
                            <div style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                              {t('progress.subject_no_tasks')}
                            </div>
                          ) : (
                            subTasks.map((tItem) => {
                              const isTaskDone = tItem.status === TaskStatus.DONE;
                              return (
                                <div
                                  key={tItem.id}
                                  onClick={() => handleOpenTaskDetail(tItem)}
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
                                  title={t('progress.task_action_hint')}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                    {isTaskDone ? (
                                      <CheckCircle2 size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                                    ) : (
                                      <Circle size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    )}
                                    <span
                                      style={{
                                        fontSize: 'var(--type-small)',
                                        fontWeight: 600,
                                        color: isTaskDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                        textDecoration: isTaskDone ? 'line-through' : 'none',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {tItem.title}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                                    {tItem.dueDate && (
                                      <span>
                                        {t('progress.task_due', { date: formatDate(tItem.dueDate) })}
                                      </span>
                                    )}
                                    <span className={`badge ${tItem.priority === TaskPriority.URGENT ? 'badge-rose' : tItem.priority === TaskPriority.HIGH ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>
                                      {tItem.priority}
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
                <h2 style={{ fontSize: 'var(--type-section)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {t('progress.task_action_panel_title', { count: tasks.filter((t) => t.status !== TaskStatus.DONE).length })}
                </h2>
              </div>
              <span style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)' }}>
                {t('progress.task_action_hint')}
              </span>
            </div>

            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                {t('progress.no_tasks_to_display')}
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
                      title={t('progress.task_action_hint')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span className={`badge ${task.priority === TaskPriority.URGENT ? 'badge-rose' : task.priority === TaskPriority.HIGH ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: 'var(--type-caption)', padding: '1px 6px' }}>
                          {task.priority}
                        </span>

                        {task.subject && (
                          <span className="badge badge-blue" style={{ fontSize: 'var(--type-caption)', padding: '1px 6px' }}>
                            {task.subject.code || task.subject.name}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 'var(--type-small)',
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

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          <span>{task.dueDate ? formatDate(task.dueDate) : t('progress.no_due_date')}</span>
                        </div>
                        <span style={{ color: isDone ? 'var(--color-success)' : 'var(--accent-primary)', fontWeight: 600 }}>
                          {isDone ? t('progress.status_done') : t('progress.status_doing')}
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
