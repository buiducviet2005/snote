import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { NotesListPage } from '../features/notes';
import { TasksListPage } from '../features/tasks';
import { ScheduleWeekPage } from '../features/schedule';
import { SemesterOverviewPage } from '../features/semesters';
import { StatusPage } from '../features/status';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/notes" replace /> },
      { path: 'notes', element: <NotesListPage /> },
      { path: 'tasks', element: <TasksListPage /> },
      { path: 'schedule', element: <ScheduleWeekPage /> },
      { path: 'semesters', element: <SemesterOverviewPage /> },
      { path: 'status', element: <StatusPage /> }
    ]
  }
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
