import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>🧠</span> SNOTE
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/notes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>📝</span> Ghi chú (Notes)
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>✅</span> Công việc (Tasks)
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>📅</span> Lịch trình (Schedule)
        </NavLink>
        <NavLink to="/semesters" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>🎓</span> Học kỳ & Môn học
        </NavLink>
      </nav>
    </aside>
  );
};
