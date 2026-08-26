import React from 'react';

export const Topbar: React.FC = () => {
  return (
    <header className="topbar">
      <div>
        <strong>Học kỳ 1 (2025 - 2026)</strong>
      </div>
      <div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sinh viên Demo</span>
      </div>
    </header>
  );
};
