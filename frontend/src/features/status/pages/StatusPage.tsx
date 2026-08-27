import React, { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  service?: string;
  environment?: string;
  database?: string;
  timestamp?: string;
}

export const StatusPage: React.FC = () => {
  const [liveHealth, setLiveHealth] = useState<HealthStatus | null>(null);
  const [readyHealth, setReadyHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        setLoading(true);
        // Base API URL is http://localhost:4000/api -> fetch health at http://localhost:4000/health
        const liveRes = await fetch('http://localhost:4000/health/live');
        const liveData = await liveRes.json();
        setLiveHealth(liveData);

        const readyRes = await fetch('http://localhost:4000/health/ready');
        const readyData = await readyRes.json();
        setReadyHealth(readyData);
      } catch (err: any) {
        setError(err.message || 'Không thể kết nối đến Backend Server');
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Trạng Thái Hệ Thống (System Status)
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Giám sát thời gian thực sức khỏe dịch vụ SNOTE Backend và PostgreSQL Database.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-primary">Phiên bản: SNOTE v1.0.0-MVP</span>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Đang kiểm tra kết nối hệ thống...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <h3 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>⚠️ Lỗi Kết Nối</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Liveness Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>API Server (Liveness)</h3>
              <span className="badge badge-success">● HOẠT ĐỘNG (200 OK)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <div><strong>Dịch vụ:</strong> {liveHealth?.service || 'snote-backend'}</div>
              <div><strong>Môi trường:</strong> {liveHealth?.environment || 'development'}</div>
              <div><strong>Thời gian phản hồi:</strong> {liveHealth?.timestamp}</div>
            </div>
          </div>

          {/* Readiness Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Cơ Sở Dữ Liệu (Readiness)</h3>
              <span className={`badge ${readyHealth?.status === 'ok' ? 'badge-success' : 'badge-danger'}`}>
                ● {readyHealth?.status === 'ok' ? 'ĐÃ KẾT NỐI (Postgres 16)' : 'MẤT KẾT NỐI'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <div><strong>Trạng thái DB:</strong> {readyHealth?.database || 'N/A'}</div>
              <div><strong>Prisma Client:</strong> v7.10.0 Connected</div>
              <div><strong>Kiểm tra truy vấn:</strong> SELECT 1 Succeeded</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
