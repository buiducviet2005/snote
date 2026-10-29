import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Check, FolderKanban, GraduationCap, UserRound, UsersRound } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
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

export function WorkspacesPage() {
  const { workspaces, currentWorkspace, onSelectWorkspace, refreshWorkspaces, workspacesLoading, workspacesError } = useOutletContext<PageContext>();
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [pendingInvitation, setPendingInvitation] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const workspaceLabels = useMemo(() => ({
    PERSONAL: t('workspaces.personal'),
    SUBJECT: t('workspaces.subject'),
    PROJECT: t('workspaces.project'),
    GROUP: t('workspaces.group')
  }), [t]);

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
      showToast(t('workspaces.create_success'), 'success');
      setName('');
      setDescription('');
      setParams({}, { replace: true });
      await refreshWorkspaces();
    } catch (error: any) {
      showToast(error?.response?.data?.message || t('workspaces.create_error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const respondToInvitation = async (id: string, accept: boolean) => {
    setPendingInvitation(id);
    try {
      await api.post(`/workspaces/invitations/${id}/${accept ? 'accept' : 'decline'}`, {});
      showToast(accept ? t('workspaces.joined_success') : t('workspaces.declined_success'), 'success');
      await Promise.all([loadInvitations(), refreshWorkspaces()]);
    } catch (error: any) {
      showToast(error?.response?.data?.message || t('workspaces.invite_error'), 'error');
    } finally {
      setPendingInvitation(null);
    }
  };

  return <div className="workspaces-page">
    <header className="workspaces-page-header">
      <div>
        <p className="workspaces-eyebrow">{t('workspaces.eyebrow')}</p>
        <h1>{t('workspaces.your_workspaces')}</h1>
        <p>{t('workspaces.desc')}</p>
      </div>
    </header>

    {params.get('create') === '1' && <form className="workspaces-create-form" onSubmit={createWorkspace}>
      <div className="workspaces-form-head">
        <h2>{t('workspaces.create_personal_project')}</h2>
        <button type="button" onClick={() => setParams({}, { replace: true })}>{t('common.close')}</button>
      </div>
      <label htmlFor="workspace-name">{t('workspaces.ws_name')}</label>
      <input id="workspace-name" required maxLength={150} autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={t('workspaces.ws_name_placeholder')} />
      <label htmlFor="workspace-description">{t('workspaces.ws_desc')}</label>
      <textarea id="workspace-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
      <button type="submit" disabled={saving || !name.trim()}>{saving ? t('workspaces.creating') : t('workspaces.create_workspace')}</button>
    </form>}

    {invitations.length > 0 && <section className="workspaces-invitations">
      <h2>{t('workspaces.invitations', { count: invitations.length })}</h2>
      {invitations.map((invitation) => <div className="workspaces-invitation" key={invitation.id}>
        <div>
          <strong>{invitation.workspace?.name}</strong>
          <small>{invitation.invitedBy?.fullName ? t('workspaces.invitation_from', { name: invitation.invitedBy.fullName }) : t('workspaces.invitation_default')}</small>
        </div>
        <div>
          <button disabled={pendingInvitation === invitation.id} onClick={() => respondToInvitation(invitation.id, true)}>{t('workspaces.accept')}</button>
          <button disabled={pendingInvitation === invitation.id} onClick={() => respondToInvitation(invitation.id, false)}>{t('workspaces.decline')}</button>
        </div>
      </div>)}
    </section>}

    <section className="workspaces-directory" aria-label={t('common.all')}>
      <div className="workspaces-directory-head">
        <h2>{t('common.all')} <span>{workspaces.length}</span></h2>
        <input type="search" aria-label={t('workspaces.select_workspace')} placeholder={t('common.search')} value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {workspacesLoading ? <p className="workspaces-state">{t('workspaces.loading_ws')}</p> : workspacesError && workspaces.length === 0 ? <div className="workspaces-state">{t('workspaces.error_ws')} <button onClick={refreshWorkspaces}>{t('common.refresh')}</button></div> : filtered.length === 0 ? <p className="workspaces-state">{t('workspaces.empty_title')}</p> :
        <div className="workspaces-grid">{filtered.map((workspace) => {
          const Icon = workspace.type === 'PERSONAL' ? UserRound : workspace.type === 'SUBJECT' ? GraduationCap : workspace.type === 'GROUP' ? UsersRound : FolderKanban;
          const roleLabel = workspace.role === 'OWNER' ? (language === 'vi' ? 'Sở hữu' : 'Owner') : workspace.role === 'MANAGER' ? (language === 'vi' ? 'Quản lý' : 'Manager') : (language === 'vi' ? 'Thành viên' : 'Member');
          const archivedLabel = workspace.status === 'ARCHIVED' ? ` · ${language === 'vi' ? 'Đã lưu trữ' : 'Archived'}` : '';
          return <button type="button" key={workspace.id} className={`workspaces-card ${workspace.id === currentWorkspace.id ? 'selected' : ''}`} onClick={() => onSelectWorkspace(workspace)}>
            <span className="workspaces-card-icon"><Icon size={20} /></span>
            <span className="workspaces-card-main">
              <strong>{workspace.name}</strong>
              <small>{workspace.className ? `${workspace.className} · ` : ''}{workspaceLabels[workspace.type]} · {roleLabel}{archivedLabel}</small>
            </span>
            {workspace.id === currentWorkspace.id && <span className="workspaces-card-check"><Check size={16} /></span>}
          </button>;
        })}</div>}
    </section>
    <section className="workspaces-class-note">
      <UsersRound size={18} />
      <p>
        <strong>{language === 'vi' ? 'Lớp học và nhóm' : 'Classes and Teams'}</strong>
        <br />
        {language === 'vi'
          ? 'Giáo viên tạo lớp, sinh viên tham gia lớp và ban cán sự chia nhóm trong tab Lớp học.'
          : 'Teachers create classes, students join via codes, and groups collaborate in the Classes tab.'}
      </p>
    </section>
    {invitesLoading && <span className="sr-only">{t('common.loading')}</span>}
  </div>;
}
