import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppFilterProvider } from './contexts/AppFilterContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppRouter } from './router';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppFilterProvider>
            <AppRouter />
          </AppFilterProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
