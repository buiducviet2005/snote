import React, { useState } from 'react';
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
  UserCheck,
  ShieldCheck,
  Zap,
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
  studyGroup: {
    id?: string;
    name: string;
    leader: { id?: string; fullName: string; email?: string };
  } | null;
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
const statusLabels: Record<string, string> = {
  PLANNED: 'Lên kế hoạch',
  ACTIVE: 'Đang làm',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ'
};

function isOverdue(project: OverviewProject, today: string) {
  return Boolean(project.dueDate && project.dueDate.slice(0, 10) < today && !finished.has(project.status));
}

export function ClassProgressOverview({ projects, loading, isManager, onOpenReports, onOpenWorkspace }: Props) {
  const [expandedTasksProjectId, setExpandedTasksProjectId] = useState<string | null>(null);

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
            <ClipboardList size={18} /> Tổng quan tiến độ & Năng suất các nhóm
          </h2>
          <p>
            {isManager
              ? 'Giảng viên & Lớp trưởng có thẩm quyền giám sát toàn bộ tasks, tiến độ làm việc và năng suất của từng thành viên trong mỗi nhóm.'
              : 'Theo dõi dự án, công việc và báo cáo của nhóm bạn.'}
          </p>
        </div>
      </div>

      {!loading && (
        <div className="classes-metrics" aria-label="Thống kê tiến độ">
          <div>
            <strong>{projects.length}</strong>
            <span>Nhóm dự án</span>
          </div>
          <div>
            <strong style={{ color: 'var(--color-info)' }}>{totalClassTasks}</strong>
            <span>Tổng số việc ({totalClassCompletedTasks} xong)</span>
          </div>
          <div>
            <strong style={{ color: totalClassOverdueTasks > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {totalClassOverdueTasks}
            </strong>
            <span>Việc trễ hạn</span>
          </div>
          <div>
            <strong style={{ color: pending > 0 ? 'var(--color-warning)' : 'inherit' }}>{pending}</strong>
            <span>Báo cáo chờ duyệt</span>
          </div>
        </div>
      )}

      {loading && <p role="status">Đang tải dữ liệu tiến độ & năng suất...</p>}

      {!loading && projects.length === 0 && (
        <p>
          {isManager
            ? 'Lớp chưa có dự án nhóm nào. Hãy tạo nhóm và giao dự án ở tab "Nhóm & dự án".'
            : 'Nhóm của bạn chưa có dự án, hoặc bạn chưa được phân nhóm.'}
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
                    <b>{project.studyGroup?.name || 'Nhóm'}</b>
                    <span>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} style={{ color: 'var(--color-warning)' }} />
                      Trưởng nhóm: <b>{project.studyGroup?.leader.fullName || 'Chưa phân công'}</b>
                    </span>
                  </small>
                  <h3>{project.name}</h3>
                </div>
                <div className="classes-progress-flags">
                  {late && (
                    <span className="classes-flag classes-flag-danger">
                      <AlertTriangle size={14} /> Trễ hạn
                    </span>
                  )}
                  {blockers && <span className="classes-flag classes-flag-warning">Có vướng mắc</span>}
                  {project.pendingReviews > 0 && (
                    <span className="classes-flag">{project.pendingReviews} báo cáo chờ duyệt</span>
                  )}
                  {project.overdueTasks !== undefined && project.overdueTasks > 0 && (
                    <span className="classes-flag classes-flag-danger">
                      {project.overdueTasks} việc quá hạn
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Dual Progress: Real Tasks Progress vs Self-Reported */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', margin: '4px 0' }}>
                <div className="classes-progress-track">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      Tiến độ hoàn thành công việc:
                    </span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      {taskRate}% ({project.completedTasks ?? 0}/{project.totalTasks ?? project._count.tasks} việc)
                    </strong>
                  </div>
                  <progress max={100} value={taskRate} style={{ accentColor: 'var(--color-success)' }} />
                </div>

                <div className="classes-progress-track">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nhóm tự báo cáo định kỳ:</span>
                    <strong>{percent === undefined ? 'Chưa báo cáo' : `${percent}%`}</strong>
                  </div>
                  <progress max={100} value={percent ?? 0} />
                </div>
              </div>

              {/* 3. Meta details */}
              <p className="classes-progress-meta">
                <span>Trạng thái: <b>{statusLabels[project.status] || project.status}</b></span>
                {' · '}
                <span>{project.dueDate ? `Hạn nộp: ${new Date(project.dueDate).toLocaleDateString('vi-VN')}` : 'Chưa có hạn'}</span>
                {' · '}
                <span>{project.totalTasks ?? project._count.tasks} công việc</span>
                {' · '}
                <span>{project._count.progressReports} báo cáo tiến độ</span>
                {project.latestReport?.reviewScore !== null && project.latestReport?.reviewScore !== undefined
                  ? ` · Điểm báo cáo mới nhất: ${project.latestReport.reviewScore}/100`
                  : ''}
              </p>

              {blockers && (
                <p className="classes-progress-blocker" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                  <strong>⚠️ Vướng mắc nhóm ghi nhận:</strong> {blockers}
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
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} style={{ color: 'var(--accent-primary)' }} />
                      Năng suất từng thành viên ({project.memberProductivity.length} người)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Tỷ lệ hoàn thành công việc được giao
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '4px 8px' }}>Thành viên</th>
                          <th style={{ padding: '4px 8px' }}>Được giao</th>
                          <th style={{ padding: '4px 8px' }}>Đã xong</th>
                          <th style={{ padding: '4px 8px' }}>Đang làm</th>
                          <th style={{ padding: '4px 8px' }}>Trễ hạn</th>
                          <th style={{ padding: '4px 8px', minWidth: '130px' }}>Biểu đồ năng suất</th>
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
                                      style={{ fontSize: '10px', padding: '1px 5px', fontWeight: 700 }}
                                      title="Trưởng nhóm"
                                    >
                                      Trưởng nhóm
                                    </span>
                                  )}
                                </div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>{member.email}</small>
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
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: barColor, minWidth: '32px' }}>
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
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ListTodo size={14} style={{ color: 'var(--accent-primary)' }} />
                      Chi tiết công việc nhóm ({project.tasks.length})
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => toggleExpandTasks(project.id)}
                    >
                      Đóng danh sách
                    </button>
                  </div>

                  {project.tasks.length === 0 ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Nhóm chưa lập công việc cụ thể nào trong dự án này.
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
                              <span style={{ fontSize: '12px', fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                {task.title}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                Phụ trách: <b>{task.assignees.map((a) => a.user.fullName).join(', ') || 'Chưa phân'}</b>
                              </span>
                              {task.dueDate && (
                                <span style={{ color: isOver ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: isOver ? 700 : 500 }}>
                                  Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                              <span
                                className={`badge ${
                                  isDone ? 'badge-green' : task.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-neutral'
                                }`}
                                style={{ fontSize: '10.5px' }}
                              >
                                {isDone ? 'Hoàn thành' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Cần làm'}
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
                  title="Xem toàn bộ danh sách công việc của nhóm"
                >
                  <ListTodo size={14} />
                  <span>{isTasksExpanded ? 'Ẩn công việc' : `Xem ${project.totalTasks ?? project._count.tasks} công việc`}</span>
                  {isTasksExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenReports(project)}
                >
                  <ClipboardList size={14} />
                  <span>Báo cáo tiến độ ({project._count.progressReports})</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenWorkspace(project.id)}
                >
                  <Eye size={14} />
                  <span>Mở Workspace Đồ Án</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && projects.length > 0 && (
        <p className="classes-overview-hint">
          <FolderKanban size={14} /> Tiến độ công việc được tính toán tự động dựa trên số tasks thực tế; giảng viên đánh giá riêng các mốc báo cáo tiến độ.
        </p>
      )}
    </section>
  );
}
