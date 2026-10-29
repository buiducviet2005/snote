import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Check, FolderKanban, GraduationCap, UserRound, UsersRound } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import type { WorkspaceInvitation, WorkspaceSummary } from '../layouts/types';
import './workspacesPage.css';

type PageContext = {
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary;
  onSelectWorkspace: (workspace: WorkspaceSummary) => void;
  refreshWorkspaces: () => Promise<void>;
  workspacesLoading: boolean;
  workspacesError: boolean;
};

const workspaceLabels = { PERSONAL: 'Cá nhân', SUBJECT: 'Môn học', PROJECT: 'Dự án', GROUP: 'Nhóm' } as const;

export function WorkspacesPage() {
  const { workspaces, currentWorkspace, onSelectWorkspace, refreshWorkspaces, workspacesLoading, workspacesError } = useOutletContext<PageContext>();
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [pendingInvitation, setPendingInvitation] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadInvitations = async () => {
    setInvitesLoading(true);
    try {
      const response = await api.get<any>('/workspaces/invitations');
      const list = response.data?.data || response.data || [];
      setInvitations(Array.isArray(list) ? list : []);
    } catch {
      setInvitations([]);
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => { void loadInvitations(); }, []);

  const filtered = useMemo(() => workspaces.filter((workspace) =>
    `${workspace.name} ${workspace.className || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ), [workspaces, query]);

  const createWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await api.post('/workspaces', { type: 'PROJECT', name: name.trim(), project: { description: description.trim() || undefined, status: 'ACTIVE' } });
      showToast('Đã tạo không gian dự án cá nhân', 'success');
      setName('');
      setDescription('');
      setParams({}, { replace: true });
      await refreshWorkspaces();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể tạo không gian', 'error');
    } finally {
      setSaving(false);
    }
  };

  const respondToInvitation = async (id: string, accept: boolean) => {
    setPendingInvitation(id);
    try {
      await api.post(`/workspaces/invitations/${id}/${accept ? 'accept' : 'decline'}`, {});
      showToast(accept ? 'Đã tham gia không gian' : 'Đã từ chối lời mời', 'success');
      await Promise.all([loadInvitations(), refreshWorkspaces()]);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Không thể xử lý lời mời', 'error');
    } finally {
      setPendingInvitation(null);
    }
  };

  return <div className="workspaces-page">
    <header className="workspaces-page-header">
      <div><p className="workspaces-eyebrow">KHÔNG GIAN LÀM VIỆC</p><h1>Không gian của bạn</h1><p>Chọn không gian để làm việc. Nhóm được lập trong lớp học; dự án cá nhân được tạo tại đây.</p></div>
    </header>

    {params.get('create') === '1' && <form className="workspaces-create-form" onSubmit={createWorkspace}>
      <div className="workspaces-form-head"><h2>Dự án cá nhân mới</h2><button type="button" onClick={() => setParams({}, { replace: true })}>Đóng</button></div>
      <label htmlFor="workspace-name">Tên không gian</label>
      <input id="workspace-name" required maxLength={150} autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Đồ án môn học" />
      <label htmlFor="workspace-description">Mô tả (tùy chọn)</label>
      <textarea id="workspace-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
      <button type="submit" disabled={saving || !name.trim()}>{saving ? 'Đang tạo…' : 'Tạo không gian'}</button>
    </form>}

    {invitations.length > 0 && <section className="workspaces-invitations"><h2>Lời mời ({invitations.length})</h2>
      {invitations.map((invitation) => <div className="workspaces-invitation" key={invitation.id}>
        <div><strong>{invitation.workspace?.name}</strong><small>{invitation.invitedBy?.fullName ? `Từ ${invitation.invitedBy.fullName}` : 'Lời mời tham gia'}</small></div>
        <div><button disabled={pendingInvitation === invitation.id} onClick={() => respondToInvitation(invitation.id, true)}>Chấp nhận</button><button disabled={pendingInvitation === invitation.id} onClick={() => respondToInvitation(invitation.id, false)}>Từ chối</button></div>
      </div>)}
    </section>}

    <section className="workspaces-directory" aria-label="Tất cả không gian">
      <div className="workspaces-directory-head"><h2>Tất cả không gian <span>{workspaces.length}</span></h2><input type="search" aria-label="Tìm không gian" placeholder="Tìm không gian…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      {workspacesLoading ? <p className="workspaces-state">Đang tải không gian…</p> : workspacesError && workspaces.length === 0 ? <div className="workspaces-state">Không thể tải danh sách. <button onClick={refreshWorkspaces}>Thử lại</button></div> : filtered.length === 0 ? <p className="workspaces-state">Không tìm thấy không gian phù hợp.</p> :
        <div className="workspaces-grid">{filtered.map((workspace) => {
          const Icon = workspace.type === 'PERSONAL' ? UserRound : workspace.type === 'SUBJECT' ? GraduationCap : workspace.type === 'GROUP' ? UsersRound : FolderKanban;
          return <button type="button" key={workspace.id} className={`workspaces-card ${workspace.id === currentWorkspace.id ? 'selected' : ''}`} onClick={() => onSelectWorkspace(workspace)}>
            <span className="workspaces-card-icon"><Icon size={20} /></span><span className="workspaces-card-main"><strong>{workspace.name}</strong><small>{workspace.className ? `${workspace.className} · ` : ''}{workspaceLabels[workspace.type]} · {workspace.role === 'OWNER' ? 'Sở hữu' : workspace.role === 'MANAGER' ? 'Quản lý' : 'Thành viên'}{workspace.status === 'ARCHIVED' ? ' · Đã lưu trữ' : ''}</small></span>
            {workspace.id === currentWorkspace.id && <span className="workspaces-card-check"><Check size={16} /></span>}
          </button>;
        })}</div>}
    </section>
    <section className="workspaces-class-note"><UsersRound size={18} /><p><strong>Lớp học và nhóm</strong><br />Giáo viên tạo lớp, sinh viên tham gia lớp và ban cán sự chia nhóm trong tab Lớp học.</p></section>
    {invitesLoading && <span className="sr-only">Đang tải lời mời</span>}
  </div>;
}
