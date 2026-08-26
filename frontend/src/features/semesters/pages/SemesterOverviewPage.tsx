import React from 'react';

export const SemesterOverviewPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Học kỳ & Môn học (Semesters)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Trục tổ chức chính cho toàn bộ ghi chú, công việc và đồ án
          </p>
        </div>
        <button className="btn">+ Thêm Học kỳ</button>
      </div>
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>🎓 Học kỳ 1 (2025 - 2026)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          01/09/2025 – 15/01/2026 • Trạng thái: Đang diễn ra (ACTIVE)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 6, borderLeft: '4px solid #3b82f6' }}>
            <strong>Cơ sở dữ liệu</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>IT3020 • 3 Tín chỉ</p>
          </div>
          <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 6, borderLeft: '4px solid #10b981' }}>
            <strong>Mạng máy tính</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>IT3080 • 3 Tín chỉ</p>
          </div>
          <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 6, borderLeft: '4px solid #f59e0b' }}>
            <strong>Lập trình Web</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>IT4409 • 3 Tín chỉ</p>
          </div>
        </div>
      </div>
    </div>
  );
};
