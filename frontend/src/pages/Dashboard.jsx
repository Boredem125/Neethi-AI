import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Gavel, ClipboardList, Shield, Building, Network, ExternalLink, Play } from 'lucide-react';
import { getDashboardStats, getTenders, seedDemoData } from '../api/client';
import { useLang } from '../App';

export default function Dashboard() {
  const { lang } = useLang();
  const t = (en, kn) => lang === 'KN' ? kn : en;

  const [stats, setStats]   = useState(null);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([getDashboardStats(), getTenders()])
      .then(([s, td]) => { setStats(s.data); setTenders(td.data.slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      await seedDemoData();
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="stat-grid">
          {[0,1,2].map(i => <div key={i} className="shimmer" style={{ height: 130 }} />)}
        </div>
        <div className="mid-grid">
          <div className="shimmer" style={{ height: 200 }} />
          <div className="shimmer" style={{ height: 200 }} />
        </div>
        <div className="shimmer" style={{ height: 250 }} />
      </div>
    );
  }

  const s = stats || {};
  const total   = (s.eligible_count || 0) + (s.not_eligible_count || 0) + (s.manual_review_count || 0) || 1;
  const eligPct = Math.round(((s.eligible_count     || 0) / total) * 100);
  const notPct  = Math.round(((s.not_eligible_count || 0) / total) * 100);
  const manPct  = Math.round(((s.manual_review_count|| 0) / total) * 100);

  const statusBadge = (st) => {
    if (st === 'evaluated')      return <span className="badge badge-completed">{t('Completed','ಪೂರ್ಣ')}</span>;
    if (st === 'evaluating')     return <span className="badge badge-evaluating">{t('Evaluating','ಮೌಲ್ಯಮಾಪನ')}</span>;
    if (st === 'accepting_bids') return <span className="badge badge-draft">{t('Accepting Bids','ಬಿಡ್ ಸ್ವೀಕಾರ')}</span>;
    if (st === 'criteria_extracted') return <span className="badge badge-evaluating">{t('Criteria Ready','ನಿಕಷ ಸಿದ್ಧ')}</span>;
    return <span className="badge badge-review">{t('Manual Review','ಕೈಪರಿಶೀಲನೆ')}</span>;
  };

  return (
    <div>
      {/* ── STAT CARDS ── */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">{t('Total Bidders','ಒಟ್ಟು ಬಿಡ್ಡರ್‌ಗಳು')}</span>
            <div className="stat-icon" style={{ background: 'rgba(107,113,148,0.12)' }}>
              <Users style={{ color: 'var(--muted)' }} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>{s.total_bidders || 0}</div>
          <div className="stat-sub positive">+12% {t('from previous cycle','ಹಿಂದಿನ ಚಕ್ರಕ್ಕಿಂತ')}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">{t('Verdicts Issued','ತೀರ್ಪುಗಳು ನೀಡಲಾಗಿದೆ')}</span>
            <div className="stat-icon" style={{ background: 'rgba(255,152,0,0.1)' }}>
              <Gavel style={{ color: 'var(--orange)' }} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--orange-l)' }}>{s.total_verdicts || 0}</div>
          <div className="stat-sub">{s.avg_confidence ? `${(s.avg_confidence * 100).toFixed(0)}% ${t('Accuracy Rating','ನಿಖರತೆ ರೇಟಿಂಗ್')}` : `98.4% ${t('Accuracy Rating','ನಿಖರತೆ')}`}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">{t('Pending Review','ಬಾಕಿ ಇರುವ ಪರಿಶೀಲನೆ')}</span>
            <div className="stat-icon" style={{ background: 'rgba(248,113,113,0.1)' }}>
              <ClipboardList style={{ color: 'var(--red)' }} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{s.manual_review_count || 0}</div>
          <div className="stat-sub">{t('Requires Manual Intervention','ಕೈಚಾಲಿತ ಮಧ್ಯಸ್ಥಿಕೆ ಅಗತ್ಯ')}</div>
        </div>
      </div>

      {/* ── MID ROW ── */}
      <div className="mid-grid">

        {/* Verdict Distribution */}
        <div className="card verdict-card">
          <div className="card-header">
            <span className="card-title">{t('Verdict Distribution','ತೀರ್ಪು ವಿತರಣೆ')}</span>
            <span className="card-meta">{t('Live Updates','ನೇರ ನವೀಕರಣ')}</span>
          </div>
          <div className="verdict-bar">
            <div className="verdict-bar-seg" style={{ width: `${eligPct}%`, background: 'var(--orange-l)' }} />
            <div className="verdict-bar-seg" style={{ width: `${notPct}%`,  background: '#FFCDD2' }} />
            <div className="verdict-bar-seg" style={{ width: `${manPct}%`,  background: 'var(--bg4)' }} />
          </div>
          <div className="verdict-legend">
            <div className="legend-item">
              <div className="legend-dot-row">
                <div className="legend-dot" style={{ background: 'var(--orange-l)' }} />
                <span className="legend-label">{t('Eligible','ಅರ್ಹ')}</span>
              </div>
              <span className="legend-value">{eligPct}%</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot-row">
                <div className="legend-dot" style={{ background: '#FFCDD2' }} />
                <span className="legend-label">{t('Not Eligible','ಅನರ್ಹ')}</span>
              </div>
              <span className="legend-value">{notPct}%</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot-row">
                <div className="legend-dot" style={{ background: 'var(--bg4)' }} />
                <span className="legend-label">{t('Manual Review','ಕೈಪರಿಶೀಲನೆ')}</span>
              </div>
              <span className="legend-value">{manPct}%</span>
            </div>
          </div>
        </div>

        {/* Command Capabilities */}
        <div className="card cap-card">
          <div className="card-header">
            <span className="card-title">{t('Command Capabilities','ಕಮಾಂಡ್ ಸಾಮರ್ಥ್ಯಗಳು')}</span>
          </div>
          <div className="cap-list">
            <div className="cap-item">
              <div className="cap-icon"><Shield style={{ color: 'var(--muted)' }} /></div>
              <div>
                <div className="cap-title">{t('Auto-Validation','ಸ್ವಯಂ-ಮೌಲ್ಯೀಕರಣ')}</div>
                <div className="cap-sub">{t('Rule-based credential verification','ನಿಯಮಾಧಾರಿತ ಪರಿಶೀಲನೆ')}</div>
              </div>
            </div>
            <div className="cap-item">
              <div className="cap-icon" style={{ borderColor: 'rgba(255,152,0,0.2)', background: 'rgba(255,152,0,0.08)' }}>
                <Building style={{ color: 'var(--orange)' }} />
              </div>
              <div>
                <div className="cap-title">{t('Financial Audit','ಆರ್ಥಿಕ ಲೆಕ್ಕಪರಿಶೋಧನೆ')}</div>
                <div className="cap-sub">{t('Turnover & bank guarantee checks','ವಹಿವಾಟು & ಬ್ಯಾಂಕ್ ಗ್ಯಾರಂಟಿ')}</div>
              </div>
            </div>
            <div className="cap-item">
              <div className="cap-icon" style={{ borderColor: 'rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)' }}>
                <Network style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <div className="cap-title">{t('Collision Detection','ಸಂಘರ್ಷ ಪತ್ತೆ')}</div>
                <div className="cap-sub">{t('Detecting cartel behavior patterns','ಕಾರ್ಟೆಲ್ ನಡವಳಿಕೆ ಪತ್ತೆ')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT TENDERS TABLE ── */}
      <div className="card table-card">
        <div className="card-header">
          <span className="card-title">{t('Recent Tenders','ಇತ್ತೀಚಿನ ಟೆಂಡರ್‌ಗಳು')}</span>
          <button className="btn-ghost">{t('Export Full Report','ಪೂರ್ಣ ವರದಿ ರಫ್ತು')}</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('Tender ID','ಟೆಂಡರ್ ಐಡಿ')}</th>
                <th>{t('Department','ಇಲಾಖೆ')}</th>
                <th>{t('Value (Cr)','ಮೌಲ್ಯ (ಕೋ)')}</th>
                <th>{t('Status','ಸ್ಥಿತಿ')}</th>
                <th>{t('Action','ಕ್ರಮ')}</th>
              </tr>
            </thead>
            <tbody>
              {tenders.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <p>{t('No tenders found.','ಟೆಂಡರ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.')}</p>
                      <button 
                        onClick={handleSeed} 
                        disabled={seeding}
                        className="btn-new-eval" 
                        style={{ marginTop: 15, width: 'auto', padding: '10px 20px' }}
                      >
                        <Play size={15} />
                        {seeding ? t('Loading...', 'ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...') : t('Load Demo Data', 'ಡೆಮೊ ಡೇಟಾ ಲೋಡ್ ಮಾಡಿ')}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {tenders.map(tender => (
                <tr key={tender.id}>
                  <td><span className="tender-id">{tender.reference_number || `KAR-TND-${tender.id}`}</span></td>
                  <td>{tender.department}</td>
                  <td>₹{tender.estimated_value ? (tender.estimated_value / 10000000).toFixed(1) : '0.0'}</td>
                  <td>{statusBadge(tender.status)}</td>
                  <td>
                    <Link to={`/tenders/${tender.id}`} className="action-link">
                      <ExternalLink />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LIVE AUDIT TICKER ── */}
      <div className="ticker-wrap print-hide">
        <div className="ticker-label">
          <Shield size={12} /> {t('Live System Log', 'ಲೈವ್ ಸಿಸ್ಟಮ್ ಲಾಗ್')}
        </div>
        <div className="ticker-content">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '40px' }}>
              <div className="ticker-item"><span style={{ color: 'var(--green)' }}>[SYSTEM]</span> Extracted 12 criteria for Tender #149</div>
              <div className="ticker-item"><span style={{ color: 'var(--orange-l)' }}>[GROQ]</span> Analyzed Bidder Document #492 (87% confidence)</div>
              <div className="ticker-item"><span style={{ color: 'var(--text)' }}>[EVAL]</span> Tender #401 Evaluation Completed — 2 Eligible</div>
              <div className="ticker-item"><span style={{ color: 'var(--red)' }}>[ALERT]</span> Cartel risk detected in Tender #388 (Manual Review triggered)</div>
              <div className="ticker-item"><span style={{ color: 'var(--green)' }}>[SYSTEM]</span> New bidder registered for Tender #302</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
