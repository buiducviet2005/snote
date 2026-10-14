import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
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
import { AiChatPage } from '../features/ai';
import { ClassesPage } from '../features/classes/pages/ClassesPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:token" element={<PublicShareViewPage />} />

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/notes" replace />} />
          <Route path="/notes" element={<NotesListPage />} />
          <Route path="/tasks" element={<TasksListPage />} />
          <Route path="/schedule" element={<ScheduleWeekPage />} />
          <Route path="/semesters" element={<SemesterOverviewPage />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/ai-chat" element={<AiChatPage />} />
          <Route path="/progress" element={<ProgressDashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/status" element={<SystemStatusPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/notes" replace />} />
    </Routes>
  );
};
