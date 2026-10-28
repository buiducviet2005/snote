import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FloatingAiChatbot } from '../../features/ai';

export const AppLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main className="app-main-content" style={{ flex: 1, padding: 'clamp(12px, 2.5vw, 28px)', overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Floating AI Copilot - Always available, takes 0 screen space when collapsed */}
      <FloatingAiChatbot />
    </div>
  );
};
