import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { api, ApiResponse } from '../../../services/api';
import {
  Settings,
  User,
  Copy,
  Check,
  Sun,
  Moon,
  Download,
  Upload,
  ShieldCheck,
  Database,
  Sparkles,
  GraduationCap,
  Clock,
  Mail,
  Fingerprint,
  Lock,
  Save,
  KeyRound,
  ShieldAlert,
  FileText,
  Layers,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Globe
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { semesters, subjects } = useAppFilter();
  const { t, language, setLanguage } = useLanguage();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Ho_Chi_Minh');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Backup Granular State
  const [exportSemesterId, setExportSemesterId] = useState('');
  const [exportSubjectId, setExportSubjectId] = useState('');
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingMarkdown, setDownloadingMarkdown] = useState(false);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setTimezone(user.timezone || 'Asia/Ho_Chi_Minh');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast(t('settings.fullname_empty'), 'error');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        timezone: timezone.trim()
      });
      showToast(t('settings.profile_saved'), 'success');
    } catch (err: any) {
      showToast(err.message || t('settings.profile_save_error'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast(t('settings.password_empty'), 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast(t('settings.password_short'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('settings.password_mismatch'), 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword
      });
      showToast(t('settings.password_changed'), 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || t('settings.password_error'), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // 1. Export JSON (Full or Granular)
  const handleExportJson = async () => {
    setDownloadingJson(true);
    try {
      const params = new URLSearchParams();
      if (exportSemesterId) params.append('semesterId', exportSemesterId);
      if (exportSubjectId) params.append('subjectId', exportSubjectId);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      await api.download(`/backup/export${queryStr}`, `snote_backup_${user?.id || 'data'}_${Date.now()}.json`);
      showToast(t('settings.export_json_success'), 'success');
    } catch (err: any) {
      showToast(err.message || t('settings.export_json_error'), 'error');
    } finally {
      setDownloadingJson(false);
    }
  };

  // 2. Export Markdown Notes
  const handleExportMarkdown = async () => {
    setDownloadingMarkdown(true);
    try {
      const params = new URLSearchParams();
      if (exportSemesterId) params.append('semesterId', exportSemesterId);
      if (exportSubjectId) params.append('subjectId', exportSubjectId);

      const res = await api.get<ApiResponse<any[]>>(`/backup/export-markdown?${params.toString()}`);
      const notes = res.data || [];

      if (notes.length === 0) {
        showToast(t('settings.export_md_empty'), 'info');
        return;
      }

      // Download single md file or multiple formatted
      if (notes.length === 1) {
        const blob = new Blob([notes[0].content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = notes[0].fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Concatenated bundle or json of notes
        const allNotesMarkdown = notes.map((n: any) => n.content).join('\n\n---\n\n');
        const blob = new Blob([allNotesMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snote_notes_bundle_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }

      showToast(t('settings.export_md_success', { count: notes.length }), 'success');
    } catch (err: any) {
      showToast(err.message || t('settings.export_md_error'), 'error');
    } finally {
      setDownloadingMarkdown(false);
    }
  };

  // 3. Restore JSON
  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast(t('settings.choose_file_prompt'), 'error');
      return;
    }

    setRestoring(true);
    setRestoreResult(null);

    try {
      const text = await restoreFile.text();
      const payload = JSON.parse(text);

      const res = await api.post<ApiResponse<any>>('/backup/restore', {
        payload,
        mode: restoreMode
      });

      setRestoreResult(res.data?.restoredCounts || {});
      showToast(t('settings.restore_success'), 'success');
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast(err.message || t('settings.restore_error'), 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleCopyId = async () => {
    if (user?.id) {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(user.id);
      } catch {
        showToast(t('common.copy_failed'), 'error');
        return;
      }

      setCopiedId(true);
      showToast(t('common.copied'), 'info');
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {t('settings.title')}
          </h1>
          <span className={`badge ${isAdmin ? 'badge-rose' : 'badge-blue'}`} style={{ fontSize: '11px', fontWeight: 600 }}>
            {isAdmin ? t('nav.admin_role') : (user as any)?.role === 'TEACHER' ? t('classes.role_teacher') : t('classes.role_student')}
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Edit Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {t('settings.profile_section')}
            </h2>
          </div>
          <span className="badge badge-neutral">
            ID: {user?.id ? `${user.id.slice(0, 8)}...` : 'N/A'}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.fullname_label')}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="snote-input"
                style={{ fontWeight: 600 }}
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.email_label')}
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="snote-input"
                style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            {/* Timezone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.timezone_label')}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="snote-select"
              >
                <option value="Asia/Ho_Chi_Minh">Giờ Việt Nam (Asia/Ho_Chi_Minh - GMT+7)</option>
                <option value="Asia/Bangkok">Bangkok (Asia/Bangkok - GMT+7)</option>
                <option value="Asia/Tokyo">Tokyo / Seoul (GMT+9)</option>
                <option value="UTC">Giờ Quốc Tế (UTC)</option>
              </select>
            </div>

            {/* User ID copy */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.user_id_label')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  disabled
                  value={user?.id || ''}
                  className="snote-input"
                  style={{ opacity: 0.7, fontSize: '11.5px', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="btn btn-secondary btn-icon"
                  title={t('settings.copy_user_id')}
                >
                  {copiedId ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
              style={{ fontWeight: 600 }}
            >
              <Save size={15} />
              <span>{savingProfile ? t('common.saving') : t('settings.save_profile_btn')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Language Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Globe size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('settings.language_section')}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`btn ${language === 'vi' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', flex: 1, minWidth: '180px', justifyContent: 'flex-start' }}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🇻🇳</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{t('settings.lang_vi_title')}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{t('settings.lang_vi_desc')}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', flex: 1, minWidth: '180px', justifyContent: 'flex-start' }}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🇬🇧</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{t('settings.lang_en_title')}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{t('settings.lang_en_desc')}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Appearance & Theme Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sun size={20} style={{ color: 'var(--color-warning)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('settings.appearance_section')}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTheme('dark')}
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', flex: 1, minWidth: '180px', justifyContent: 'flex-start' }}
          >
            <Moon size={18} />
            <div style={{ textAlign: 'left', marginLeft: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{t('settings.theme_dark_title')}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{t('settings.theme_dark_desc')}</div>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', flex: 1, minWidth: '180px', justifyContent: 'flex-start' }}
          >
            <Sun size={18} />
            <div style={{ textAlign: 'left', marginLeft: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{t('settings.theme_light_title')}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{t('settings.theme_light_desc')}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Change Password Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <KeyRound size={20} style={{ color: 'var(--color-warning)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('settings.password_section')}
          </h2>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.current_password')}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="snote-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.new_password')}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="snote-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('settings.confirm_password')}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="snote-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={savingPassword}
              className="btn btn-secondary"
              style={{ fontWeight: 600 }}
            >
              <Lock size={15} />
              <span>{savingPassword ? t('common.updating') : t('settings.save_password_btn')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Advanced Backup & Export Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Database size={20} style={{ color: 'var(--color-info)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('settings.backup_section')}
          </h2>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('settings.backup_desc')}
        </p>

        {/* Granular Selection Filter */}
        <div
          style={{
            padding: '14px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('settings.backup_scope')}
          </div>

          <select
            value={exportSemesterId}
            onChange={(e) => {
              setExportSemesterId(e.target.value);
              setExportSubjectId('');
            }}
            className="snote-select"
            style={{ fontSize: '12.5px', width: '180px' }}
          >
            <option value="">{t('settings.all_semesters')}</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={exportSubjectId}
            onChange={(e) => setExportSubjectId(e.target.value)}
            className="snote-select"
            style={{ fontSize: '12.5px', width: '200px' }}
          >
            <option value="">{t('settings.all_subjects')}</option>
            {subjects
              .filter((s) => !exportSemesterId || s.semesterId === exportSemesterId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code || 'MÔN'}] {s.name}
                </option>
              ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportJson}
            disabled={downloadingJson}
            className="btn btn-primary"
            style={{ padding: '10px 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} />
            <span>{downloadingJson ? t('common.loading') : t('settings.export_json_btn')}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            disabled={downloadingMarkdown}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>{downloadingMarkdown ? t('common.loading') : t('settings.export_md_btn')}</span>
          </button>

          <span className="badge badge-green" style={{ padding: '6px 12px' }}>
            <ShieldCheck size={13} />
            <span>{t('settings.checksum_badge')}</span>
          </span>
        </div>
      </div>

      {/* Restore Data Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <RefreshCw size={20} style={{ color: 'var(--color-success)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('settings.restore_section')}
          </h2>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('settings.restore_desc')}
        </p>

        <form onSubmit={handleRestore} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="snote-input"
              style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', flex: 1, minWidth: '240px' }}
            />

            <select
              value={restoreMode}
              onChange={(e) => setRestoreMode(e.target.value as any)}
              className="snote-select"
              style={{ fontSize: '12.5px', width: '220px' }}
            >
              <option value="MERGE">{t('settings.restore_mode_merge')}</option>
              <option value="REPLACE" disabled>{t('settings.restore_mode_replace')}</option>
            </select>

            <button
              type="submit"
              disabled={restoring || !restoreFile}
              className="btn btn-primary"
              style={{ padding: '9px 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={16} />
              <span>{restoring ? t('settings.restoring') : t('settings.start_restore_btn')}</span>
            </button>
          </div>
        </form>

        {/* Restore Result Card */}
        {restoreResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '13px',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>{t('settings.restore_result_title')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '8px' }}>
              <div>• {t('settings.restore_result_semesters', { count: restoreResult.semesters || 0 })}</div>
              <div>• {t('settings.restore_result_subjects', { count: restoreResult.subjects || 0 })}</div>
              <div>• {t('settings.restore_result_notes', { count: restoreResult.notes || 0 })}</div>
              <div>• {t('settings.restore_result_tasks', { count: restoreResult.tasks || 0 })}</div>
              <div>• {t('settings.restore_result_projects', { count: restoreResult.projects || 0 })}</div>
              <div>• {t('settings.restore_result_events', { count: restoreResult.scheduleEvents || 0 })}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--text-muted)',
          fontSize: '12.5px'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <GraduationCap size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>{t('settings.footer_tagline')}</span>
        </div>
        <p style={{ margin: 0 }}>
          {t('settings.footer_architecture')}
        </p>
      </div>
    </div>
  );
};
