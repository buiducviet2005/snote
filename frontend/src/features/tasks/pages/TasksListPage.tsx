import React from 'react';

export const TasksListPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Công việc & Bài tập (Tasks)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Theo dõi deadline bài tập, mức độ ưu tiên và tiến độ hoàn thành
          </p>
        </div>
        <button className="btn">+ Thêm Task</button>
      </div>
      <div className="card empty-state">
        <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>✅ Danh sách công việc trống</p>
        <p style={{ fontSize: '0.875rem' }}>Bạn chưa có bài tập hay deadline nào cần xử lý.</p>
      </div>
    </div>
  );
};
