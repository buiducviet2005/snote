import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Users, ClipboardList, GraduationCap, Copy, Trash2, Filter } from 'lucide-react';
import { api, ApiResponse } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ProjectWorkspaceModal } from '../../projects/components/ProjectWorkspaceModal';
import { UserRole } from '@snote/shared';
import { ClassProgressOverview, OverviewProject } from '../components/ClassProgressOverview';
import './ClassesPage.css';

type Person = { id: string; fullName: string; email: string; avatarUrl?: string | null };
type ClassMember = { userId: string; role: 'CLASS_ADMIN' | 'STUDENT'; user: Person };
type ClassProject = {
  id: string; name: string; description?: string | null; status: string; dueDate?: string | null;
  _count: { tasks: number; notes: number; progressReports: number };
  members: Array<{ userId: string }>;
};
type StudyGroup = {
  id: string; name: string; leaderId: string; leader: Person;
  members: Array<{ userId: string; user: Person }>;
};
type CourseClass = {
  id: string; teacherId: string; name: string; code?: string | null; term?: string | null;
  description?: string | null; teacher: Person; members: ClassMember[]; groups: StudyGroup[]; projects: ClassProject[];
};
type ClassSummary = {
  id: string; teacherId: string; name: string; code?: string | null; term?: string | null;
  members: Array<{ role: 'CLASS_ADMIN' | 'STUDENT' }>;
  _count: { members: number; groups: number; projects: number };
};
type ProgressReport = {
  id: string; progressPercent: number; summary: string; blockers?: string | null;
  reviewScore?: number | null; reviewComment?: string | null; createdAt: string;
  submittedBy: Person; reviewedBy?: Person | null;
};

const dateInputToApi = (value: string) => `${value}T00:00:00.000Z`;

export const ClassesPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { t, formatDate, formatDateTime } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('classId');
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'groups' || tabParam === 'students' || tabParam === 'projects' ? tabParam : 'overview';
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classesError, setClassesError] = useState('');
  const [classesReloadKey, setClassesReloadKey] = useState(0);
  const [detail, setDetail] = useState<CourseClass | null>(null);
  const [overviewProjects, setOverviewProjects] = useState<OverviewProject[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [classLoadError, setClassLoadError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [classSearch, setClassSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classTerm, setClassTerm] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupLeaderId, setGroupLeaderId] = useState('');
  const [projectMemberIds, setProjectMemberIds] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const reportRequestRef = useRef(0);
  const reportPanelRef = useRef<HTMLElement | null>(null);
  const reportTriggerRef = useRef<HTMLElement | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [reportSummary, setReportSummary] = useState('');
  const [reportBlockers, setReportBlockers] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<'TASKS' | 'NOTES' | 'MEMBERS' | 'DISCUSSION'>('MEMBERS');
  const [joinCode, setJoinCode] = useState('');

  const loadClasses = useCallback(async () => {
    const result = await api.get<ApiResponse<ClassSummary[]>>('/classes');
    setClasses(result.data || []);
    setClassesError('');
  }, []);

  const loadClass = useCallback(async (id: string) => {
    const result = await api.get<ApiResponse<CourseClass>>(`/classes/${id}`);
    if (selectedIdRef.current === id) setDetail(result.data);
  }, []);

  const loadOverview = useCallback(async (id: string) => {
    const result = await api.get<ApiResponse<OverviewProject[]>>(`/classes/${id}/overview`);
    if (selectedIdRef.current === id) setOverviewProjects(result.data || []);
  }, []);

  const loadReports = useCallback(async (classId: string, projectId: string) => {
    const requestId = ++reportRequestRef.current;
    setReportsLoading(true);
    setReportsError('');
    try {
      const result = await api.get<ApiResponse<ProgressReport[]>>(`/classes/${classId}/projects/${projectId}/reports`);
      if (requestId === reportRequestRef.current && selectedIdRef.current === classId) setReports(result.data || []);
    } catch (error) {
      if (requestId === reportRequestRef.current && selectedIdRef.current === classId) {
        setReports([]);
        setReportsError(error instanceof Error ? error.message : t('classes.reports_error'));
      }
      throw error;
    } finally {
      if (requestId === reportRequestRef.current) setReportsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    loadClasses().catch((error: Error) => setClassesError(error.message || t('classes.load_error', { error: '' })))
      .finally(() => setLoading(false));
  }, [loadClasses, classesReloadKey, t]);

  useEffect(() => {
    if (loading || classesError) return;
    if ((selectedId && classes.some((item) => item.id === selectedId)) || (!selectedId && classes.length === 0)) return;
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      if (classes[0]) updated.set('classId', classes[0].id);
      else updated.delete('classId');
      return updated;
    }, { replace: true });
  }, [classes, classesError, loading, selectedId, setSearchParams]);

  const selectedClassExists = Boolean(selectedId && classes.some((item) => item.id === selectedId));

  useEffect(() => {
    setDetail(null);
    setOverviewProjects([]);
    setClassLoadError('');
    setOverviewError('');
    setSelectedProject(null);
    setReports([]);
    setReportsError('');
    setPendingOnly(false);
    reportRequestRef.current += 1;
    setReportsLoading(false);
    if (selectedId && selectedClassExists) {
      let active = true;
      setOverviewLoading(true);
      Promise.allSettled([loadClass(selectedId), loadOverview(selectedId)])
        .then(([classResult, overviewResult]) => {
          if (!active) return;
          if (classResult.status === 'rejected') setClassLoadError(classResult.reason instanceof Error ? classResult.reason.message : t('classes.load_detail_error', { error: '' }));
          if (overviewResult.status === 'rejected') setOverviewError(overviewResult.reason instanceof Error ? overviewResult.reason.message : t('classes.reports_error'));
        })
        .finally(() => { if (active) setOverviewLoading(false); });
      return () => { active = false; };
    }
  }, [selectedId, selectedClassExists, loadClass, loadOverview, reloadKey, t]);

  const selectClass = (id: string) => setSearchParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set('classId', id);
    updated.set('tab', 'overview');
    return updated;
  });

  const selectTab = (tab: 'overview' | 'groups' | 'students' | 'projects') => setSearchParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set('tab', tab);
    return updated;
  });

  const operate = async (action: () => Promise<unknown>, message: string, refreshReports = false) => {
    setBusy(true);
    try {
      await action();
      window.dispatchEvent(new Event('snote_refresh_workspaces'));
      showToast(message, 'success');
      await loadClasses();
      if (selectedId) await Promise.all([loadClass(selectedId), loadOverview(selectedId)]);
      setClassLoadError('');
      setOverviewError('');
      if (refreshReports && selectedId && selectedProject) await loadReports(selectedId, selectedProject.id);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('classes.operation_error'), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const isTeacher = Boolean(detail && user?.id === detail.teacherId);
  const classRole = detail?.members.find((member) => member.userId === user?.id)?.role;
  const isManager = isTeacher || classRole === 'CLASS_ADMIN';
  const selectedClassProject = detail?.projects.find((project) => project.id === selectedProject?.id);
  const canReport = Boolean(selectedClassProject?.members.some((member) => member.userId === user?.id));
  const classQuery = classSearch.trim().toLocaleLowerCase('vi');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    classes.forEach((c) => {
      if (c.term?.trim()) {
        const match = c.term.match(/\d{4}(-\d{4})?/);
        if (match) {
          yearsSet.add(match[0]);
        } else {
          yearsSet.add(c.term.trim());
        }
      }
    });
    return Array.from(yearsSet).sort().reverse();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const matchesQuery = `${item.name} ${item.code || ''} ${item.term || ''}`
        .toLocaleLowerCase('vi')
        .includes(classQuery);
      if (!matchesQuery) return false;

      if (selectedYear !== 'ALL') {
        return (item.term || '').includes(selectedYear);
      }
      return true;
    });
  }, [classes, classQuery, selectedYear]);
  const visibleReports = pendingOnly ? reports.filter((report) => report.reviewScore == null) : reports;

    const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const done = await operate(async () => {
      const res = await api.post('/classes/join', { code: joinCode.trim() });
      return res;
    }, t('classes.join_success'));
    if (done) {
      setJoinCode('');
      loadClasses();
    }
  };

  const createClass = async (event: React.FormEvent) => {
    event.preventDefault();
    let createdId = '';
    const done = await operate(async () => {
      const result = await api.post<ApiResponse<{ id: string }>>('/classes', { name: className.trim(), code: classCode.trim() || undefined, term: classTerm.trim() || undefined });
      createdId = result.data.id;
    }, t('classes.create_success'));
    if (done) { setClassName(''); setClassCode(''); setClassTerm(''); if (createdId) selectClass(createdId); }
  };

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/members`, { email: memberEmail.trim() }), t('classes.added_student_success'));
    if (done) setMemberEmail('');
  };

  const createGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/groups`, { name: groupName.trim(), leaderId: groupLeaderId }), t('classes.created_group_success'));
    if (done) { setGroupName(''); setGroupLeaderId(''); }
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/projects`, {
      name: projectName.trim(),
      dueDate: projectDueDate ? dateInputToApi(projectDueDate) : undefined,
      memberIds: projectMemberIds.length ? projectMemberIds : undefined
    }), t('classes.created_project_success'));
    if (done) { setProjectName(''); setProjectDueDate(''); setProjectMemberIds([]); }
  };

  const openReports = async (project: { id: string; name: string }) => {
    if (!selectedId) return;
    reportTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedProject(project);
    setReports([]);
    setReportsError('');
    setPendingOnly(false);
    setReviewingId(null);
    try { await loadReports(selectedId, project.id); }
    catch (error) { if (selectedIdRef.current === selectedId) showToast(error instanceof Error ? error.message : t('classes.reports_error'), 'error'); }
  };

  useEffect(() => {
    if (selectedProject) reportPanelRef.current?.focus();
  }, [selectedProject]);

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !selectedProject) return;
    const done = await operate(() => api.post(`/classes/${selectedId}/projects/${selectedProject.id}/reports`, {
      progressPercent, summary: reportSummary.trim(), blockers: reportBlockers.trim() || undefined
    }), t('classes.submitted_report_success'), true);
    if (done) { setReportSummary(''); setReportBlockers(''); }
  };

  const reviewReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !selectedProject || !reviewingId) return;
    const done = await operate(() => api.put(`/classes/${selectedId}/projects/${selectedProject.id}/reports/${reviewingId}/review`, {
      reviewScore, reviewComment: reviewComment.trim()
    }), t('classes.evaluated_report_success'), true);
    if (done) { setReviewingId(null); setReviewComment(''); }
  };

  return <div className="classes-page">
    <header className="classes-heading">
      <div><span className="badge badge-blue"><GraduationCap size={14} /> {t('classes.badge_space')}</span>
        <h1>{t('classes.header_title')}</h1>
      </div>
    </header>

    {user?.role === UserRole.STUDENT && (
      <details className="classes-panel" open>
        <summary style={{ cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> {t('classes.join_with_uid_code')}
        </summary>
        <form className="classes-form" onSubmit={handleJoinClass}>
          <label style={{ flex: 2 }}>
            {t('classes.join_desc')}
            <input
              className="snote-input"
              required
              maxLength={100}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder={t('classes.join_placeholder')}
            />
          </label>
          <button className="btn btn-primary" disabled={busy || !joinCode.trim()}>
            {t('classes.join_btn')}
          </button>
        </form>
      </details>
    )}

    {(user?.role === UserRole.TEACHER || isAdmin) && <details className="classes-panel">
      <summary><Plus size={16} /> {t('classes.create_class_summary')}</summary>
      <form className="classes-form" onSubmit={createClass}>
        <label>{t('classes.class_name_label')}<input className="snote-input" required minLength={2} maxLength={150} value={className} onChange={(e) => setClassName(e.target.value)} placeholder={t('classes.class_name_placeholder')} /></label>
        <label>{t('classes.class_code')}<input className="snote-input" maxLength={50} value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder={t('classes.class_code_placeholder')} /></label>
        <label>{t('classes.class_term_label')}<input className="snote-input" maxLength={100} value={classTerm} onChange={(e) => setClassTerm(e.target.value)} placeholder={t('classes.class_term_placeholder')} /></label>
        <button className="btn btn-primary" disabled={busy}>{t('classes.create_btn')}</button>
      </form>
    </details>}

    {isAdmin && <details className="classes-panel">
      <summary><GraduationCap size={16} /> {t('classes.grant_teacher_summary')}</summary>
      <form className="classes-form" onSubmit={async (event) => {
        event.preventDefault();
        const done = await operate(() => api.post('/classes/teachers', { email: teacherEmail.trim() }), t('classes.granted_teacher_success'));
        if (done) setTeacherEmail('');
      }}>
        <label>{t('classes.teacher_email_label')}<input className="snote-input" type="email" required value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} /></label>
        <button className="btn btn-primary" disabled={busy}>{t('classes.grant_role_btn')}</button>
      </form>
    </details>}

    <div className="classes-layout">
      <aside className="classes-panel classes-list" aria-label={t('classes.my_classes')}>
        <h2>{t('classes.my_classes')}</h2>
        {classes.length > 3 && <label className="classes-search">{t('classes.search_label')}<input className="snote-input" type="search" value={classSearch} onChange={(event) => setClassSearch(event.target.value)} placeholder={t('classes.search_placeholder_short')} /></label>}
        {availableYears.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', margin: '6px 0 10px 0' }}>
            <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Filter size={11} /> {t('classes.filter_year')}:
            </span>
            <button
              type="button"
              className={`btn btn-sm ${selectedYear === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 'var(--type-caption)', padding: '1px 6px', borderRadius: '4px' }}
              onClick={() => setSelectedYear('ALL')}
            >
              {t('common.all')}
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`btn btn-sm ${selectedYear === year ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 'var(--type-caption)', padding: '1px 6px', borderRadius: '4px' }}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        )}
        {loading && <p>{t('classes.loading_classes')}</p>}
        {classesError && <p role="alert">{t('classes.load_error', { error: classesError })} <button type="button" className="btn btn-secondary btn-sm" onClick={() => setClassesReloadKey((current) => current + 1)}>{t('common.retry')}</button></p>}
        {!loading && !classesError && classes.length === 0 && <p>{t('classes.no_classes')}</p>}
        {!loading && !classesError && classes.length > 0 && filteredClasses.length === 0 && <p>{t('classes.no_classes_found')}</p>}
        {filteredClasses.map((item) => <button key={item.id} type="button" className={`classes-list-item ${selectedId === item.id ? 'active' : ''}`} aria-current={selectedId === item.id ? 'page' : undefined} onClick={() => selectClass(item.id)}>
          <strong>{item.name}</strong><span>{item.code || '—'} · {item.term || '—'}</span>
          <small>{t('classes.students_count', { count: item._count.members })} · {t('classes.groups_count', { count: item._count.groups })}</small>
        </button>)}
      </aside>

      <main className="classes-main">
        {selectedId && selectedClassExists && (!detail || detail.id !== selectedId) && <div className="classes-panel" role={classLoadError ? 'alert' : 'status'}>
          {classLoadError ? <>{t('classes.load_detail_error', { error: classLoadError })} <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadKey((current) => current + 1)}>{t('common.retry')}</button></> : t('classes.loading_detail')}
        </div>}
        {detail && detail.id === selectedId && <>
          <section className="classes-panel">
            <div className="classes-section-head">
              <div>
                <span className="badge badge-purple">{isTeacher ? t('classes.role_teacher') : classRole === 'CLASS_ADMIN' ? t('classes.role_class_admin') : t('classes.role_student')}</span>
                <h2>{detail.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '6px 0', fontSize: 'var(--type-small)', color: 'var(--text-secondary)' }}>
                  <span>{t('classes.role_teacher')}: <b>{detail.teacher.fullName}</b></span>
                  <span>·</span>
                  <span>{detail.term || '—'}</span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('classes.code_prefix')} <code>{detail.code || '—'}</code>
                  </span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t('classes.uid_prefix')} <code style={{ fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--text-primary)' }}>{detail.id}</code>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 'var(--type-caption)', padding: '2px 9px', fontWeight: 700, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                      onClick={() => {
                        navigator.clipboard.writeText(detail.id);
                        showToast(t('classes.copy_uid_toast'), 'success');
                      }}
                      title={t('classes.copy_uid_tooltip')}
                    >
                      <Copy size={12} />
                      <span>{t('classes.copy_uid')}</span>
                    </button>
                  </span>
                </div>
              </div>
            </div>
            {detail.description && <p>{detail.description}</p>}
            {isTeacher && <details>
              <summary>{t('classes.edit_class_info')}</summary>
              <form className="classes-form" onSubmit={async (event) => {
                event.preventDefault();
                if (!selectedId) return;
                const form = new FormData(event.currentTarget);
                await operate(() => api.put(`/classes/${selectedId}`, {
                  name: String(form.get('name') || '').trim(),
                  code: String(form.get('code') || '').trim(),
                  term: String(form.get('term') || '').trim(),
                  description: String(form.get('description') || '').trim()
                }), t('classes.updated_class_success'));
              }}>
                <label>{t('classes.class_name_label')}<input className="snote-input" name="name" required minLength={2} maxLength={150} defaultValue={detail.name} /></label>
                <label>{t('classes.class_code')}<input className="snote-input" name="code" maxLength={50} defaultValue={detail.code || ''} /></label>
                <label>{t('classes.class_term_label')}<input className="snote-input" name="term" maxLength={100} defaultValue={detail.term || ''} /></label>
                <label>{t('common.description')}<textarea className="snote-textarea" name="description" rows={2} defaultValue={detail.description || ''} /></label>
                <button className="btn btn-primary" disabled={busy}>{t('common.save')}</button>
              </form>
            </details>}
          </section>

          <nav className="classes-tabs" aria-label={t('classes.header_title')}>
            <button type="button" className={activeTab === 'overview' ? 'active' : ''} aria-current={activeTab === 'overview' ? 'page' : undefined} onClick={() => selectTab('overview')}>{t('classes.productivity')}</button>
            <button type="button" className={activeTab === 'groups' ? 'active' : ''} aria-current={activeTab === 'groups' ? 'page' : undefined} onClick={() => selectTab('groups')}>{t('classes.tab_groups', { count: detail.groups.length })}</button>
            <button type="button" className={activeTab === 'students' ? 'active' : ''} aria-current={activeTab === 'students' ? 'page' : undefined} onClick={() => selectTab('students')}>{t('classes.tab_students', { count: detail.members.length })}</button>
            <button type="button" className={activeTab === 'projects' ? 'active' : ''} aria-current={activeTab === 'projects' ? 'page' : undefined} onClick={() => selectTab('projects')}>{t('classes.tab_projects', { count: detail.projects.length })}</button>
          </nav>

          {activeTab === 'overview' && (overviewError ? <section className="classes-panel" role="alert">{t('classes.load_detail_error', { error: overviewError })} <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReloadKey((current) => current + 1)}>{t('common.retry')}</button></section> : <ClassProgressOverview projects={overviewProjects} loading={overviewLoading} isManager={isManager} onOpenReports={openReports} onOpenWorkspace={setWorkspaceProjectId} />)}

          {activeTab === 'students' && <section className="classes-panel">
            <div className="classes-section-head"><h2><Users size={18} /> {t('classes.student_roster_title', { count: detail.members.length })}</h2></div>
            {isManager && <form className="classes-form" onSubmit={addMember}>
              <label>{t('classes.add_student_by_email')}<input className="snote-input" type="email" required value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} /></label>
              <button className="btn btn-primary" disabled={busy}>{t('classes.add_to_class_btn')}</button>
            </form>}
            <div className="classes-roster">{detail.members.map((member) => <div className="classes-person" key={member.userId}>
              <span><strong>{member.user.fullName}</strong><small>{member.user.email}</small></span>
              <span className="classes-actions">
                {isTeacher ? <select className="snote-select" aria-label={`Vai trò của ${member.user.fullName}`} value={member.role} disabled={busy} onChange={(e) => selectedId && operate(() => api.put(`/classes/${selectedId}/members/${member.userId}`, { role: e.target.value }), t('classes.updated_role_success'))}>
                  <option value="STUDENT">{t('classes.role_student')}</option><option value="CLASS_ADMIN">{t('classes.role_class_admin')}</option>
                </select> : <span className={`badge ${member.role === 'CLASS_ADMIN' ? 'badge-blue' : 'badge-neutral'}`} style={{ fontSize: 'var(--type-caption)' }}>{member.role === 'CLASS_ADMIN' ? t('classes.role_class_admin') : t('classes.role_student')}</span>}
                {isManager && member.userId !== user?.id && (isTeacher || member.role !== 'CLASS_ADMIN') && <button type="button" className="btn btn-ghost btn-icon" title={t('classes.remove_student_confirm', { name: member.user.fullName })} disabled={busy} onClick={() => selectedId && window.confirm(t('classes.remove_student_confirm', { name: member.user.fullName })) && operate(() => api.delete(`/classes/${selectedId}/members/${member.userId}`), t('classes.removed_student_success'))}><Trash2 size={15} /></button>}
              </span>
            </div>)}</div>
          </section>}

          {activeTab === 'groups' && <section className="classes-panel">
            <div className="classes-section-head"><h2><Users size={18} /> {t('classes.study_groups_title', { count: detail.groups.length })}</h2></div>
            {isManager && <form className="classes-form" onSubmit={createGroup}>
              <label>{t('classes.group_name_label')}<input className="snote-input" required minLength={2} maxLength={150} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nhóm 1" /></label>
              <label>{t('classes.leader_label')}<select className="snote-select" required value={groupLeaderId} onChange={(e) => setGroupLeaderId(e.target.value)}><option value="">{t('classes.select_student_option')}</option>{detail.members.filter((member) => !detail.groups.some((group) => group.members.some((m) => m.userId === member.userId))).map((member) => <option value={member.userId} key={member.userId}>{member.user.fullName}</option>)}</select></label>
              <button className="btn btn-primary" disabled={busy}>{t('classes.add_group_btn')}</button>
            </form>}
            {detail.groups.length === 0 && <p>{t('classes.no_groups')}</p>}
            <div className="classes-groups">{detail.groups.map((group) => {
              const isLeader = group.leaderId === user?.id;
              const canManageGroup = isManager || isLeader;
              const available = detail.members.filter((member) => !detail.groups.some((item) => item.members.some((m) => m.userId === member.userId)));
              return <article className="classes-group" key={group.id}>
                <div className="classes-section-head"><div><h3>{group.name}</h3><p>{t('classes.leader_prefix', { name: group.leader.fullName })} · {t('classes.students_count', { count: group.members.length })}</p></div>
                  {isTeacher && <button type="button" className="btn btn-ghost btn-icon" title={t('classes.delete_group_confirm', { name: group.name })} disabled={busy} onClick={() => selectedId && window.confirm(t('classes.delete_group_confirm', { name: group.name })) && operate(() => api.delete(`/classes/${selectedId}/groups/${group.id}`), t('classes.deleted_group_success'))}><Trash2 size={16} /></button>}
                </div>
                {isManager && <div className="classes-group-management">
                  <form className="classes-form" onSubmit={(event) => {
                    event.preventDefault();
                    if (!selectedId) return;
                    const name = String(new FormData(event.currentTarget).get('name') || '').trim();
                    if (name && name !== group.name) operate(() => api.put(`/classes/${selectedId}/groups/${group.id}`, { name }), t('classes.renamed_group_success'));
                  }}>
                    <label>{t('classes.group_name_label')}<input className="snote-input" name="name" key={group.name} defaultValue={group.name} required minLength={2} maxLength={150} /></label>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>{t('classes.save_group_name')}</button>
                  </form>
                  <form className="classes-form" onSubmit={(event) => {
                    event.preventDefault();
                    if (!selectedId) return;
                    const leaderId = String(new FormData(event.currentTarget).get('leaderId') || '');
                    if (leaderId && leaderId !== group.leaderId && window.confirm(t('classes.transfer_leader_confirm'))) {
                      operate(() => api.put(`/classes/${selectedId}/groups/${group.id}/leader`, { userId: leaderId }), t('classes.transferred_leader_success'));
                    }
                  }}>
                    <label>{t('classes.leader_label')}<select className="snote-select" name="leaderId" key={group.leaderId} defaultValue={group.leaderId} disabled={busy}>
                      {group.members.map((member) => <option key={member.userId} value={member.userId}>{member.user.fullName}</option>)}
                    </select></label>
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>{t('classes.transfer_leader_btn')}</button>
                  </form>
                </div>}
                <div className="classes-roster">{group.members.map((member) => <div className="classes-person" key={member.userId}><span>{member.user.fullName}{member.userId === group.leaderId && <small>{t('classes.leader_tag')}</small>}</span>
                  {canManageGroup && member.userId !== group.leaderId && <button type="button" className="btn btn-ghost btn-icon" title={t('classes.remove_member_confirm', { name: member.user.fullName })} disabled={busy} onClick={() => selectedId && window.confirm(t('classes.remove_member_confirm', { name: member.user.fullName })) && operate(() => api.delete(`/classes/${selectedId}/groups/${group.id}/members/${member.userId}`), t('classes.removed_member_success'))}><Trash2 size={15} /></button>}
                </div>)}</div>
                {canManageGroup && available.length > 0 && <label className="classes-inline-label">{t('classes.add_member_label')}
                  <select className="snote-select" value="" disabled={busy} onChange={(e) => selectedId && e.target.value && operate(() => api.post(`/classes/${selectedId}/groups/${group.id}/members`, { userId: e.target.value }), t('classes.added_member_success'))}>
                    <option value="">{t('classes.select_student_in_class')}</option>{available.map((member) => <option value={member.userId} key={member.userId}>{member.user.fullName}</option>)}
                  </select></label>}
                {canManageGroup && available.length === 0 && <small style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', marginTop: '8px' }}>{t('classes.all_students_assigned')}</small>}
              </article>;
            })}</div>
          </section>}

          {activeTab === 'projects' && <section className="classes-panel">
            <div className="classes-section-head"><h2><FolderKanban size={18} /> {t('classes.projects_title', { count: detail.projects.length })}</h2></div>
            {isManager && <form className="classes-form" onSubmit={createProject}>
              <label>{t('projects.project_name')}<input className="snote-input" required minLength={2} maxLength={150} value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
              <label>{t('projects.due_date')}<input className="snote-input" type="date" value={projectDueDate} onChange={(e) => setProjectDueDate(e.target.value)} /></label>
              <label>{t('classes.project_members_label')}<select className="snote-select" multiple value={projectMemberIds} onChange={(e) => setProjectMemberIds(Array.from(e.target.selectedOptions, (option) => option.value))} style={{ minHeight: '92px' }}>{detail.members.map((member) => <option key={member.userId} value={member.userId}>{member.user.fullName}</option>)}</select></label>
              <button className="btn btn-primary" disabled={busy}>{t('common.create')}</button>
            </form>}
            {detail.projects.length === 0 && <p>{isManager ? t('classes.no_projects_teacher') : t('classes.no_projects_student')}</p>}
            <div className="classes-projects">{detail.projects.map((project) => {
              const isProjectMember = project.members.some((member) => member.userId === user?.id);
              return <div className="classes-project" key={project.id}>
                <div><strong style={{ cursor: (isManager || isProjectMember) ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => { if (isManager || isProjectMember) { setWorkspaceInitialTab('TASKS'); setWorkspaceProjectId(project.id); } }} title={(isManager || isProjectMember) ? t('projects.open_workspace_tooltip') : undefined}>{project.name}</strong><small>{t(`classes.status_${project.status.toLowerCase()}` as any) || project.status} · {t('classes.tasks_count_metric', { count: project._count.tasks })} · {t('classes.reports_count_metric', { count: project._count.progressReports })} · {t('classes.students_count', { count: project.members.length })}{project.dueDate ? ` · ${t('classes.due_label', { date: formatDate(project.dueDate) })}` : ''}</small></div>
                <div className="classes-actions">{(isManager || isProjectMember) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => openReports(project)}><ClipboardList size={14} /> {t('nav.progress')}</button>}
                  {(isManager || isProjectMember) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setWorkspaceInitialTab('MEMBERS'); setWorkspaceProjectId(project.id); }} title={t('classes.project_members_label')} aria-label={t('classes.project_members_label')}><Users size={14} /> {t('projects.members')}</button>}
                  {isTeacher && selectedId && <button type="button" className="btn btn-ghost btn-icon" title={t('classes.delete_project_confirm', { name: project.name })} disabled={busy} onClick={() => window.confirm(t('classes.delete_project_confirm', { name: project.name })) && operate(() => api.delete(`/classes/${selectedId}/projects/${project.id}`), t('classes.deleted_project_success'))}><Trash2 size={15} /></button>}
                </div>
                {isManager && selectedId && <form className="classes-form classes-project-edit" key={`${project.id}-${project.status}-${project.dueDate || ''}`} onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const status = String(form.get('status') || project.status);
                  const dueDate = String(form.get('dueDate') || '');
                  const currentDate = project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : '';
                  if (status !== project.status || dueDate !== currentDate) {
                    operate(() => api.put(`/classes/${selectedId}/projects/${project.id}`, {
                      status, dueDate: dueDate ? dateInputToApi(dueDate) : null
                    }), t('classes.updated_project_success'));
                  }
                }}><label>{t('projects.project_status')}<select className="snote-select" name="status" defaultValue={project.status} disabled={busy}>
                  <option value="PLANNED">{t('classes.status_planned')}</option><option value="ACTIVE">{t('classes.status_active')}</option><option value="ON_HOLD">{t('classes.status_on_hold')}</option><option value="COMPLETED">{t('classes.status_completed')}</option><option value="ARCHIVED">{t('classes.status_archived')}</option>
                </select></label><label>{t('projects.due_date')}<input className="snote-input" name="dueDate" type="date" defaultValue={project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : ''} disabled={busy} /></label>
                <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>{t('common.save')}</button>
                </form>}
              </div>;
            })}</div>
          </section>}

          {selectedProject && selectedId && <section className="classes-panel" aria-label={t('classes.report_title')} ref={reportPanelRef} tabIndex={-1}>
            <div className="classes-section-head"><div><h2><ClipboardList size={18} /> {t('classes.project_progress_title', { name: selectedProject.name })}</h2><p>{t('classes.report_section_desc')}</p></div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSelectedProject(null); reportTriggerRef.current?.focus(); }}>{t('common.close')}</button></div>
            {canReport && <form className="classes-form classes-report-form" onSubmit={submitReport}>
              <label>{t('classes.report_progress_pct')}<input className="snote-input" type="number" min={0} max={100} required value={progressPercent} onChange={(e) => setProgressPercent(Number(e.target.value))} /></label>
              <label>{t('classes.report_summary')}<textarea className="snote-textarea" rows={3} required maxLength={5000} value={reportSummary} onChange={(e) => setReportSummary(e.target.value)} /></label>
              <label>{t('classes.report_blockers')}<textarea className="snote-textarea" rows={2} maxLength={5000} value={reportBlockers} onChange={(e) => setReportBlockers(e.target.value)} /></label>
              <button className="btn btn-primary" disabled={busy}>{t('classes.submit_report_btn')}</button>
            </form>}
            {reportsLoading && <p role="status">{t('classes.loading_reports')}</p>}
            {reportsError && <p role="alert">{t('classes.reports_error_with_msg', { error: reportsError })}</p>}
            {!reportsLoading && !reportsError && reports.length === 0 && <p>{t('classes.no_reports')}</p>}
            {isTeacher && reports.length > 0 && <button type="button" className="btn btn-secondary btn-sm" aria-pressed={pendingOnly} onClick={() => setPendingOnly((current) => !current)}>{pendingOnly ? t('classes.show_all_reports') : t('classes.show_pending_only', { count: reports.filter((report) => report.reviewScore == null).length })}</button>}
            {!reportsLoading && pendingOnly && visibleReports.length === 0 && <p>{t('classes.no_pending_reports')}</p>}
            {visibleReports.map((report) => <article className="classes-report" key={report.id}>
              <div className="classes-section-head"><strong>{report.progressPercent}% · {report.submittedBy.fullName}</strong><small>{formatDateTime(report.createdAt)}</small></div>
              <p>{report.summary}</p>{report.blockers && <p><strong>{t('classes.blockers_label')}</strong> {report.blockers}</p>}
              {report.reviewScore !== null && report.reviewScore !== undefined && <p className="classes-review"><strong>{t('classes.review_score_label', { score: report.reviewScore })}</strong> {report.reviewComment}</p>}
              {isTeacher && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setReviewingId(report.id); setReviewScore(report.reviewScore ?? 0); setReviewComment(report.reviewComment || ''); }}>{t('classes.review_btn')}</button>}
              {reviewingId === report.id && <form className="classes-form" onSubmit={reviewReport}>
                <label>{t('classes.score_label')}<input className="snote-input" type="number" min={0} max={100} required value={reviewScore} onChange={(e) => setReviewScore(Number(e.target.value))} /></label>
                <label>{t('classes.comment_label')}<textarea className="snote-textarea" required minLength={1} maxLength={5000} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} /></label>
                <button className="btn btn-primary" disabled={busy}>{t('classes.save_review_btn')}</button>
              </form>}
            </article>)}
          </section>}
        </>}
      </main>
    </div>
    <ProjectWorkspaceModal isOpen={Boolean(workspaceProjectId)} projectId={workspaceProjectId} initialTab={workspaceInitialTab} onClose={() => setWorkspaceProjectId(null)} onRefreshParent={() => { if (selectedId) loadClass(selectedId); }} />
  </div>;
};
