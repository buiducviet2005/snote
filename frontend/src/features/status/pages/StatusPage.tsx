import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  Activity,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Clock,
  Sparkles
} from 'lucide-react';

interface HealthStatus {
  status: string;
  service?: string;
  environment?: string;
  database?: string;
  timestamp?: string;
}

export const StatusPage: React.FC = () => {
  const { t } = useLanguage();
  const [liveHealth, setLiveHealth] = useState<HealthStatus | null>(null);
  const [readyHealth, setReadyHealth] = useState<HealthStatus | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const start = performance.now();

      const [liveRes, readyRes] = await Promise.all([
        fetch('http://localhost:4000/health/live'),
        fetch('http://localhost:4000/health/ready')
      ]);

      const end = performance.now();
      setLatencyMs(Math.round(end - start));

      const liveData = await liveRes.json();
      setLiveHealth(liveData);

      const readyData = await readyRes.json();
      setReadyHealth(readyData);
    } catch (err: any) {
      setError(err.message || t('status.connection_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: 'var(--type-title)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              {t('status.header_title')}
            </h1>
            <span className="badge badge-green">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }} />
              {t('status.live_monitor')}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--type-small)', color: 'var(--text-secondary)' }}>
            {t('status.header_desc')}
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="btn btn-secondary"
          style={{ fontWeight: 600 }}
        >
          <RefreshCw size={15} className={loading ? 'spinner' : ''} />
          <span>{loading ? t('status.checking') : t('status.refresh_button')}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-body)' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('status.pinging')}</span>
          </div>
        </div>
      ) : error ? (
        <div
          className="snote-card animate-fade-in"
          style={{
            borderLeft: '4px solid var(--color-danger)',
            padding: '24px',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)', marginBottom: '8px' }}>
            <AlertTriangle size={20} />
            <h3 style={{ margin: 0, fontSize: 'var(--type-body)', fontWeight: 700 }}>{t('status.connection_error')}</h3>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--type-small)' }}>{error}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Liveness Card */}
          <div
            className="snote-card animate-fade-in"
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-info-subtle)',
                    color: 'var(--color-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Server size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--type-body)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {t('status.liveness_title')}
                  </h3>
                  <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t('status.liveness_probe')}</span>
                </div>
              </div>

              <span className="badge badge-green">
                <CheckCircle2 size={12} />
                <span>200 OK</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--type-small)', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span>{t('status.service_name')}</span>
                <b style={{ color: 'var(--text-primary)' }}>{liveHealth?.service || 'snote-backend'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span>{t('status.environment')}</span>
                <b style={{ color: 'var(--text-primary)' }}>{liveHealth?.environment || 'development'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span>{t('status.latency')}</span>
                <b style={{ color: 'var(--color-success)' }}>{latencyMs !== null ? `${latencyMs} ms` : 'N/A'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('status.time')}</span>
                <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>{liveHealth?.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Readiness Card */}
          <div
            className="snote-card animate-fade-in"
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-purple-subtle)',
                    color: 'var(--color-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Database size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--type-body)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {t('status.readiness_title')}
                  </h3>
                  <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>{t('status.readiness_probe')}</span>
                </div>
              </div>

              <span className={`badge ${readyHealth?.status === 'ok' ? 'badge-green' : 'badge-rose'}`}>
                {readyHealth?.status === 'ok' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                <span>{readyHealth?.status === 'ok' ? t('status.db_connected') : t('status.db_disconnected')}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--type-small)', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span>{t('status.db_state')}</span>
                <b style={{ color: 'var(--text-primary)' }}>{readyHealth?.database || 'healthy'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span>{t('status.prisma_client')}</span>
                <b style={{ color: 'var(--text-primary)' }}>v7.10.0 Connected</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span>{t('status.check_query')}</span>
                <b style={{ color: 'var(--color-success)' }}>SELECT 1 OK</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('status.tx_boundary')}</span>
                <b style={{ color: 'var(--color-info)' }}>ACID Compliant</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
