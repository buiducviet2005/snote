import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AdminRoute } from '../components/layout/AdminRoute';
import { LoginPage, RegisterPage } from '../features/auth';
import { PublicShareViewPage } from '../features/shares/pages/PublicShareViewPage';
import { NotesListPage } from '../features/notes';
import { TasksListPage } from '../features/tasks';
import { ScheduleWeekPage } from '../features/schedule';
import { SemesterOverviewPage } from '../features/semesters';
import { ProjectsListPage } from '../features/projects';
import { ProgressDashboardPage } from '../features/progress';
import { SettingsPage } from '../features/settings';
import { SystemStatusPage } from '../features/status';
import { ClassesPage } from '../features/classes/pages/ClassesPage';
import { WorkspaceLayout } from '../workspaces/layouts';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication & Note Sharing Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:token" element={<PublicShareViewPage />} />

      {/* Protected Student Workstation Routes - All Rendered within WorkspaceLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceLayout />}>
          <Route index element={<Navigate to="/notes" replace />} />
          <Route path="/ws" element={<Navigate to="/notes" replace />} />
          <Route path="/workspace-preview" element={<Navigate to="/notes" replace />} />
          <Route path="/notes" element={<NotesListPage />} />
          <Route path="/tasks" element={<TasksListPage />} />
          <Route path="/schedule" element={<ScheduleWeekPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/semesters" element={<Navigate to="/classes" replace />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/progress" element={<ProgressDashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/status" element={<SystemStatusPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback to Default Notes Workspace */}
      <Route path="*" element={<Navigate to="/notes" replace />} />
    </Routes>
  );
};
