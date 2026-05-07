import { useState, useEffect } from 'react';
import { getAuditLogs } from '../api/client';
import { Shield } from 'lucide-react';
import { useLang } from '../App';

const ACTION_COLORS = {
  verdict_issued:     'var(--orange-l)',
  tender_created:     'var(--green)',
  review_submitted:   '#60A5FA',
  bidder_registered:  '#C084FC',
};

export default function AuditLog() {
  const { lang } = useLang();
  const t = (en, kn) => lang === 'KN' ? kn : en;

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then(r => setLogs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h2>{t('Audit Log','ಲೆಕ್ಕಪರಿಶೋಧನಾ ದಾಖಲೆ')}</h2>
          <p>{t('Append-only KTPP §13/§14 compliant audit trail','ಸೇರ್ಪಡೆ-ಮಾತ್ರ KTPP §13/§14 ಅನುಸರಣ ಲೆಕ್ಕಪರಿಶೋಧನಾ ಪಥ')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 7,
          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
          <Shield size={14} />
          {t('KTPP Compliant','KTPP ಅನುಸರಣ')}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 52 }} />)}
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="empty-state">
            <Shield size={40} />
            <p>{t('No audit events recorded yet.','ಇನ್ನೂ ಯಾವ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಘಟನೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.')}</p>
          </div>
        )}

        {!loading && logs.map((log, i) => (
          <div key={log.id} className="audit-row">
            <div className="audit-dot"
              style={{ background: ACTION_COLORS[log.action] || 'var(--orange)' }} />
            <div className="audit-time">{fmt(log.timestamp)}</div>
            <div style={{ flex: 1 }}>
              <div className="audit-action">
                {log.action?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
              <div className="audit-detail">
                {log.entity_type && <span style={{ color: 'var(--orange-l)', marginRight: 8 }}>{log.entity_type}</span>}
                {log.details && typeof log.details === 'object'
                  ? Object.entries(log.details).map(([k,v]) => `${k}: ${v}`).join(' · ')
                  : log.details || '—'
                }
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, textAlign: 'right' }}>
              {log.performed_by || t('System','ವ್ಯವಸ್ಥೆ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
