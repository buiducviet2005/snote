import { AlertTriangle, ClipboardList, Eye, FolderKanban } from 'lucide-react';

export type OverviewProject = {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
  groupId: string | null;
  studyGroup: { name: string; leader: { fullName: string } } | null;
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
  PLANNED: 'Lên kế hoạch', ACTIVE: 'Đang làm', ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành', ARCHIVED: 'Lưu trữ'
};

function isOverdue(project: OverviewProject, today: string) {
  return Boolean(project.dueDate && project.dueDate.slice(0, 10) < today && !finished.has(project.status));
}

export function ClassProgressOverview({ projects, loading, isManager, onOpenReports, onOpenWorkspace }: Props) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const overdue = projects.filter((project) => isOverdue(project, today)).length;
  const pending = projects.reduce((sum, project) => sum + project.pendingReviews, 0);
  const blocked = projects.filter((project) => Boolean(project.latestReport?.blockers?.trim())).length;
  const sorted = [...projects].sort((a, b) => {
    const priority = (project: OverviewProject) =>
      Number(isOverdue(project, today)) * 4 +
      Number(Boolean(project.latestReport?.blockers?.trim())) * 2 +
      Number(project.pendingReviews > 0);
    return priority(b) - priority(a);
  });

  return (
    <section className="classes-panel classes-overview" aria-labelledby="classes-overview-heading">
      <div className="classes-section-head">
        <div>
          <h2 id="classes-overview-heading"><ClipboardList size={18} /> Tổng quan tiến độ</h2>
          <p>{isManager ? 'Ưu tiên nhóm trễ hạn, gặp vướng mắc và báo cáo chờ đánh giá.' : 'Theo dõi dự án và báo cáo của nhóm bạn.'}</p>
        </div>
      </div>
      {!loading && <div className="classes-metrics" aria-label="Thống kê tiến độ">
        <div><strong>{projects.length}</strong><span>Dự án</span></div>
        <div><strong>{overdue}</strong><span>Trễ hạn</span></div>
        <div><strong>{blocked}</strong><span>Có vướng mắc</span></div>
        <div><strong>{pending}</strong><span>Chờ đánh giá</span></div>
      </div>}
      {loading && <p role="status">Đang tải tiến độ...</p>}
      {!loading && projects.length === 0 && <p>{isManager ? 'Lớp chưa có dự án nhóm. Hãy tạo nhóm rồi giao dự án ở tab Nhóm & dự án.' : 'Nhóm của bạn chưa có dự án, hoặc bạn chưa được phân nhóm.'}</p>}
      <div className="classes-progress-list">
        {sorted.map((project) => {
          const percent = project.latestReport?.progressPercent;
          const late = isOverdue(project, today);
          const blockers = project.latestReport?.blockers?.trim();
          return <article className="classes-progress-item" key={project.id}>
            <div className="classes-progress-main">
              <div>
                <small>{project.studyGroup?.name || 'Nhóm'} · Trưởng nhóm: {project.studyGroup?.leader.fullName || 'Chưa rõ'}</small>
                <h3>{project.name}</h3>
              </div>
              <div className="classes-progress-flags">
                {late && <span className="classes-flag classes-flag-danger"><AlertTriangle size={14} /> Trễ hạn</span>}
                {blockers && <span className="classes-flag classes-flag-warning">Có vướng mắc</span>}
                {project.pendingReviews > 0 && <span className="classes-flag">{project.pendingReviews} chờ đánh giá</span>}
              </div>
            </div>
            <div className="classes-progress-track">
              <label htmlFor={`progress-${project.id}`}>{percent === undefined ? 'Chưa có báo cáo' : `Nhóm tự báo cáo: ${percent}%`}</label>
              <progress id={`progress-${project.id}`} max={100} value={percent ?? 0} />
            </div>
            <p className="classes-progress-meta">
              {statusLabels[project.status] || project.status}
              {' · '}
              {project.dueDate ? `Hạn ${new Date(project.dueDate).toLocaleDateString('vi-VN')}` : 'Chưa có hạn nộp'}
              {' · '}{project._count.tasks} công việc
              {' · '}{project._count.progressReports} báo cáo
              {project.latestReport?.reviewScore !== null && project.latestReport?.reviewScore !== undefined
                ? ` · Điểm báo cáo mới nhất: ${project.latestReport.reviewScore}/100` : ''}
            </p>
            {blockers && <p className="classes-progress-blocker"><strong>Vướng mắc:</strong> {blockers}</p>}
            <div className="classes-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenReports(project)}><ClipboardList size={15} /> Xem báo cáo</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenWorkspace(project.id)}><Eye size={15} /> Mở dự án</button>
            </div>
          </article>;
        })}
      </div>
      {!loading && projects.length > 0 && <p className="classes-overview-hint"><FolderKanban size={14} /> Tỷ lệ hoàn thành do nhóm tự báo cáo; giảng viên đánh giá riêng từng báo cáo.</p>}
    </section>
  );
}
