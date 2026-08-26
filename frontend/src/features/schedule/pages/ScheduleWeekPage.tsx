import React from 'react';

export const ScheduleWeekPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Thời khóa biểu & Lịch thi (Schedule)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Lịch học hàng tuần và các mốc deadline quan trọng
          </p>
        </div>
        <button className="btn">+ Thêm Sự kiện</button>
      </div>
      <div className="card empty-state">
        <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📅 Chưa có sự kiện lịch</p>
        <p style={{ fontSize: '0.875rem' }}>Thời khóa biểu tuần này của bạn đang trống.</p>
      </div>
    </div>
  );
};
