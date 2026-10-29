import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { StudyDateTimePicker } from '../../../components/common/StudyDateTimePicker';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ProjectStatus } from '@snote/shared';
import { FolderKanban, Calendar, Save } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: any | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectToEdit
}) => {
  const { subjects, selectedSemesterId } = useAppFilter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setSubjectId(projectToEdit.subjectId || '');
      setStatus(projectToEdit.status || ProjectStatus.ACTIVE);
      setDueDate(projectToEdit.dueDate ? new Date(projectToEdit.dueDate).toISOString().slice(0, 10) : '');
    } else {
      setName('');
      setDescription('');
      setSubjectId(subjects[0]?.id || '');
      setStatus(ProjectStatus.ACTIVE);
      setDueDate('');
    }
  }, [projectToEdit, subjects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (projectToEdit) {
        await api.put(`/projects/${projectToEdit.id}`, {
          name: name.trim(),
          description: description.trim() || undefined,
          semesterId: selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
        });
        showToast(t('projects.update_success'), 'success');
      } else {
        await api.post('/projects', {
          name: name.trim(),
          description: description.trim() || undefined,
          semesterId: selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
        });
        showToast(t('projects.create_success'), 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? t('projects.modal_edit_title') : t('projects.modal_create_title')}
      maxWidth="620px"
      icon={<FolderKanban size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {t('projects.name_label')}
          </label>
          <input
            type="text"
            required
            placeholder={t('projects.name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="snote-input"
            style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('projects.subject_label')}
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
            >
              <option value="">{t('projects.independent_subject')}</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('projects.status_label')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="snote-select"
            >
              <option value={ProjectStatus.PLANNED}>{t('projects.status_opt_planned')}</option>
              <option value={ProjectStatus.ACTIVE}>{t('projects.status_opt_active')}</option>
              <option value={ProjectStatus.ON_HOLD}>{t('projects.status_opt_on_hold')}</option>
              <option value={ProjectStatus.COMPLETED}>{t('projects.status_opt_completed')}</option>
            </select>
          </div>
        </div>

        <div>
          <StudyDateTimePicker
            value={dueDate}
            onChange={setDueDate}
            label={t('projects.due_date_label')}
            placeholder={t('projects.due_date_placeholder')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {t('projects.desc_label')}
          </label>
          <textarea
            rows={3}
            placeholder={t('projects.desc_placeholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="snote-textarea"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={15} />
            <span>{loading ? t('projects.saving') : projectToEdit ? t('projects.save_changes') : t('projects.create_modal_btn')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
