import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  FolderKanban,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';

export type ProductivityMember = {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  isLeader: boolean;
  assignedCount: number;
  doneCount: number;
  inProgressCount: number;
  overdueCount: number;
  productivityPercent: number;
};

export type OverviewTask = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  assignees: Array<{ user: { id: string; fullName: string; email: string } }>;
};

export type OverviewProject = {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
  groupId: string | null;
  members?: Array<{ userId: string; role: string; user: { id: string; fullName: string; email: string } }>;
  _count: { tasks: number; progressReports: number };
  latestReport: {
    id: string;
    progressPercent: number;
    summary: string;
    blockers: string | null;
    reviewScore: number | null;
    reviewedAt: string | null;
    createdAt: string;
  } | null;
  pendingReviews: number;
  tasks?: OverviewTask[];
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  overdueTasks?: number;
  taskCompletionRate?: number;
  memberProductivity?: ProductivityMember[];
};

type Props = {
  projects: OverviewProject[];
  loading: boolean;
  isManager: boolean;
  onOpenReports: (project: Pick<OverviewProject, 'id' | 'name'>) => void;
  onOpenWorkspace: (projectId: string) => void;
};

const finished = new Set(['COMPLETED', 'ARCHIVED']);

function isOverdue(project: OverviewProject, today: string) {
  return Boolean(project.dueDate && project.dueDate.slice(0, 10) < today && !finished.has(project.status));
}

export function ClassProgressOverview({ projects, loading, isManager, onOpenReports, onOpenWorkspace }: Props) {
  const { t, formatDate } = useLanguage();
  const [expandedTasksProjectId, setExpandedTasksProjectId] = useState<string | null>(null);

  const statusLabels: Record<string, string> = {
    PLANNED: t('classes.status_planned'),
    ACTIVE: t('classes.status_active'),
    ON_HOLD: t('classes.status_on_hold'),
    COMPLETED: t('classes.status_completed'),
    ARCHIVED: t('classes.status_archived')
  };

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const overdue = projects.filter((project) => isOverdue(project, today)).length;
  const pending = projects.reduce((sum, project) => sum + project.pendingReviews, 0);
  const blocked = projects.filter((project) => Boolean(project.latestReport?.blockers?.trim())).length;

  const totalClassTasks = projects.reduce((sum, p) => sum + (p.totalTasks ?? p._count.tasks ?? 0), 0);
  const totalClassCompletedTasks = projects.reduce((sum, p) => sum + (p.completedTasks ?? 0), 0);
  const totalClassOverdueTasks = projects.reduce((sum, p) => sum + (p.overdueTasks ?? 0), 0);

  const sorted = [...projects].sort((a, b) => {
    const priority = (project: OverviewProject) =>
      Number(isOverdue(project, today)) * 4 +
      Number(Boolean(project.latestReport?.blockers?.trim())) * 2 +
      Number(project.pendingReviews > 0);
    return priority(b) - priority(a);
  });

  const toggleExpandTasks = (projectId: string) => {
    setExpandedTasksProjectId((prev) => (prev === projectId ? null : projectId));
  };

  return (
    <section className="classes-panel classes-overview" aria-labelledby="classes-overview-heading">
      <div className="classes-section-head">
        <div>
          <h2 id="classes-overview-heading">
            <ClipboardList size={18} /> {t('classes.overview_header')}
          </h2>
          <p>
            {isManager
              ? t('classes.overview_desc_teacher')
              : t('classes.overview_desc_student')}
          </p>
        </div>
      </div>

      {!loading && (
        <div className="classes-metrics" aria-label={t('classes.tab_overview')}>
          <div>
            <strong>{projects.length}</strong>
            <span>{t('classes.metric_groups')}</span>
          </div>
          <div>
            <strong style={{ color: 'var(--color-info)' }}>{totalClassTasks}</strong>
            <span>{t('classes.metric_tasks', { count: totalClassCompletedTasks })}</span>
          </div>
          <div>
            <strong style={{ color: totalClassOverdueTasks > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {totalClassOverdueTasks}
            </strong>
            <span>{t('classes.metric_overdue')}</span>
          </div>
          <div>
            <strong style={{ color: pending > 0 ? 'var(--color-warning)' : 'inherit' }}>{pending}</strong>
            <span>{t('classes.metric_pending_reports')}</span>
          </div>
        </div>
      )}

      {loading && <p role="status">{t('classes.loading_metrics')}</p>}

      {!loading && projects.length === 0 && (
        <p>
          {isManager
            ? t('classes.no_projects_teacher')
            : t('classes.no_projects_student')}
        </p>
      )}

      <div className="classes-progress-list">
        {sorted.map((project) => {
          const percent = project.latestReport?.progressPercent;
          const taskRate = project.taskCompletionRate ?? 0;
          const late = isOverdue(project, today);
          const blockers = project.latestReport?.blockers?.trim();
          const isTasksExpanded = expandedTasksProjectId === project.id;

          return (
            <article className="classes-progress-item" key={project.id}>
              {/* 1. Header: Group info & Flags */}
              <div className="classes-progress-main">
                <div>
                  <small style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} style={{ color: 'var(--accent-primary)' }} />
                    <b>{t('classes.students_count', { count: project.members?.length ?? project.memberProductivity?.length ?? 0 })}</b>
                  </small>
                  <h3>{project.name}</h3>
                </div>
                <div className="classes-progress-flags">
                  {late && (
                    <span className="classes-flag classes-flag-danger">
                      <AlertTriangle size={14} /> {t('classes.flag_overdue')}
                    </span>
                  )}
                  {blockers && <span className="classes-flag classes-flag-warning">{t('classes.flag_blockers')}</span>}
                  {project.pendingReviews > 0 && (
                    <span className="classes-flag">{t('classes.pending_reviews_flag', { count: project.pendingReviews })}</span>
                  )}
                  {project.overdueTasks !== undefined && project.overdueTasks > 0 && (
                    <span className="classes-flag classes-flag-danger">
                      {t('classes.overdue_tasks_count', { count: project.overdueTasks })}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Dual Progress: Real Tasks Progress vs Self-Reported */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', margin: '4px 0' }}>
                <div className="classes-progress-track">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--type-small)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t('classes.task_progress_title')}
                    </span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      {t('classes.task_progress_detail', { percent: taskRate, completed: project.completedTasks ?? 0, total: project.totalTasks ?? project._count.tasks })}
                    </strong>
                  </div>
                  <progress max={100} value={taskRate} style={{ accentColor: 'var(--color-success)' }} />
                </div>

                <div className="classes-progress-track">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--type-small)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t('classes.periodic_self_report')}</span>
                    <strong>{percent === undefined ? t('classes.unreported') : `${percent}%`}</strong>
                  </div>
                  <progress max={100} value={percent ?? 0} />
                </div>
              </div>

              {/* 3. Meta details */}
              <p className="classes-progress-meta">
                <span>{t('classes.status_prefix', { status: statusLabels[project.status] || project.status })}</span>
                {' · '}
                <span>{project.dueDate ? t('classes.due_prefix', { date: formatDate(project.dueDate) }) : t('classes.no_due')}</span>
                {' · '}
                <span>{t('classes.tasks_count_metric', { count: project.totalTasks ?? project._count.tasks })}</span>
                {' · '}
                <span>{t('classes.reports_count_metric', { count: project._count.progressReports })}</span>
                {project.latestReport?.reviewScore !== null && project.latestReport?.reviewScore !== undefined
                  ? t('classes.latest_score', { score: project.latestReport.reviewScore })
                  : ''}
              </p>

              {blockers && (
                <p className="classes-progress-blocker" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                  {t('classes.blockers_notice', { text: blockers })}
                </p>
              )}

              {/* 4. Biểu đồ & Bảng năng suất thành viên của từng nhóm (Member Productivity Matrix) */}
              {project.memberProductivity && project.memberProductivity.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '6px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} style={{ color: 'var(--accent-primary)' }} />
                      {t('classes.member_productivity_title', { count: project.memberProductivity.length })}
                    </span>
                    <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                      {t('classes.member_completion_rate')}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--type-small)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '4px 8px' }}>{t('classes.th_member')}</th>
                          <th style={{ padding: '4px 8px' }}>{t('classes.th_assigned')}</th>
                          <th style={{ padding: '4px 8px' }}>{t('classes.th_done')}</th>
                          <th style={{ padding: '4px 8px' }}>{t('classes.th_doing')}</th>
                          <th style={{ padding: '4px 8px' }}>{t('classes.th_overdue')}</th>
                          <th style={{ padding: '4px 8px', minWidth: '130px' }}>{t('classes.th_chart')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.memberProductivity.map((member) => {
                          const barColor =
                            member.productivityPercent >= 75
                              ? 'var(--color-success)'
                              : member.productivityPercent >= 40
                              ? 'var(--color-warning)'
                              : 'var(--color-danger)';

                          return (
                            <tr key={member.userId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '6px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {member.fullName}
                                  </span>
                                  {member.isLeader && (
                                    <span
                                      className="badge badge-amber"
                                      style={{ fontSize: 'var(--type-caption)', padding: '1px 5px', fontWeight: 700 }}
                                      title={t('classes.leader_tag')}
                                    >
                                      {t('classes.leader_tag')}
                                    </span>
                                  )}
                                </div>
                                <small style={{ color: 'var(--text-muted)', fontSize: 'var(--type-caption)' }}>{member.email}</small>
                              </td>
                              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{member.assignedCount}</td>
                              <td style={{ padding: '6px 8px', color: 'var(--color-success)', fontWeight: 600 }}>
                                {member.doneCount}
                              </td>
                              <td style={{ padding: '6px 8px', color: 'var(--color-warning)' }}>
                                {member.inProgressCount}
                              </td>
                              <td style={{ padding: '6px 8px', color: member.overdueCount > 0 ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: member.overdueCount > 0 ? 700 : 400 }}>
                                {member.overdueCount}
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: '6px',
                                      backgroundColor: 'var(--bg-primary)',
                                      borderRadius: '4px',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${member.productivityPercent}%`,
                                        height: '100%',
                                        backgroundColor: barColor,
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: 'var(--type-caption)', fontWeight: 700, color: barColor, minWidth: '32px' }}>
                                    {member.productivityPercent}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. Collapsible Detailed Tasks Drawer */}
              {isTasksExpanded && project.tasks && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ListTodo size={14} style={{ color: 'var(--accent-primary)' }} />
                      {t('classes.group_tasks_detail', { count: project.tasks.length })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 'var(--type-caption)', padding: '2px 8px' }}
                      onClick={() => toggleExpandTasks(project.id)}
                    >
                      {t('classes.close_list')}
                    </button>
                  </div>

                  {project.tasks.length === 0 ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--type-caption)' }}>
                      {t('classes.no_tasks_in_project')}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {project.tasks.map((task) => {
                        const isDone = task.status === 'DONE';
                        const isOver = !isDone && task.dueDate && new Date(task.dueDate) < now;

                        return (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              gap: '8px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px', flex: 1 }}>
                              {isDone ? (
                                <CheckCircle2 size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                              ) : isOver ? (
                                <AlertTriangle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                              ) : (
                                <Clock size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                              )}
                              <span style={{ fontSize: 'var(--type-small)', fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                {task.title}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--type-caption)' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {t('classes.assignee_prefix', { names: task.assignees.map((a) => a.user.fullName).join(', ') || t('classes.unassigned_text') })}
                              </span>
                              {task.dueDate && (
                                <span style={{ color: isOver ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: isOver ? 700 : 500 }}>
                                  {t('classes.due_label', { date: formatDate(task.dueDate) })}
                                </span>
                              )}
                              <span
                                className={`badge ${
                                  isDone ? 'badge-green' : task.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-neutral'
                                }`}
                                style={{ fontSize: 'var(--type-caption)' }}
                              >
                                {isDone ? t('classes.status_completed') : task.status === 'IN_PROGRESS' ? t('classes.status_active') : t('tasks.status_todo')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 6. Action buttons */}
              <div className="classes-actions" style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleExpandTasks(project.id)}
                  title={t('classes.view_tasks', { count: project.totalTasks ?? project._count.tasks })}
                >
                  <ListTodo size={14} />
                  <span>{isTasksExpanded ? t('classes.hide_tasks') : t('classes.view_tasks', { count: project.totalTasks ?? project._count.tasks })}</span>
                  {isTasksExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenReports(project)}
                >
                  <ClipboardList size={14} />
                  <span>{t('classes.reports_count_metric', { count: project._count.progressReports })}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenWorkspace(project.id)}
                >
                  <Eye size={14} />
                  <span>{t('classes.open_project_workspace')}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && projects.length > 0 && (
        <p className="classes-overview-hint">
          <FolderKanban size={14} /> {t('classes.calc_note')}
        </p>
      )}
    </section>
  );
}
