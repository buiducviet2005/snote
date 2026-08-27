import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppFilterProvider } from './contexts/AppFilterContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppFilterProvider>
          <AppRouter />
        </AppFilterProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
