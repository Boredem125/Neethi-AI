import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, MapPin, IndianRupee, ChevronRight, Plus } from 'lucide-react';
import { getTenders } from '../api/client';
import { useLang } from '../App';

export default function TenderList() {
  const { lang } = useLang();
  const t = (en, kn) => lang === 'KN' ? kn : en;

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    getTenders()
      .then(r => setTenders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (st) => {
    const map = {
      evaluated:          ['badge-completed',  t('Completed',    'ಪೂರ್ಣ')],
      evaluating:         ['badge-evaluating', t('Evaluating',   'ಮೌಲ್ಯಮಾಪನ')],
      accepting_bids:     ['badge-draft',      t('Accepting Bids','ಬಿಡ್ ಸ್ವೀಕಾರ')],
      criteria_extracted: ['badge-evaluating', t('Criteria Ready','ನಿಕಷ ಸಿದ್ಧ')],
    };
    const [cls, label] = map[st] || ['badge-review', t('Manual Review','ಕೈಪರಿಶೀಲನೆ')];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const filtered = filter === 'all' ? tenders : tenders.filter(t => t.status === filter);

  return (
    <div>
      <div className="page-heading">
        <div>
          <h2>{t('Evaluations','ಮೌಲ್ಯಮಾಪನಗಳು')}</h2>
          <p>{t('All Karnataka government tenders','ಎಲ್ಲಾ ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ಟೆಂಡರ್‌ಗಳು')}</p>
        </div>
        <Link to="/tenders/new" className="btn-new-eval" style={{ width: 'auto', padding: '9px 18px' }}>
          <Plus size={15} /> {t('New Tender','ಹೊಸ ಟೆಂಡರ್')}
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          ['all',             t('All', 'ಎಲ್ಲಾ')],
          ['evaluated',       t('Completed', 'ಪೂರ್ಣ')],
          ['accepting_bids',  t('Accepting Bids', 'ಬಿಡ್ ಸ್ವೀಕಾರ')],
          ['criteria_extracted', t('Criteria Ready', 'ನಿಕಷ ಸಿದ್ಧ')],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: filter === val ? 'var(--orange)' : 'var(--bg2)',
              color: filter === val ? '#000' : 'var(--muted)',
              border: `1px solid ${filter === val ? 'var(--orange)' : 'var(--border)'}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="tenders-grid">
          {[0,1,2].map(i => <div key={i} className="shimmer" style={{ height: 160 }} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Building size={40} />
            <p>{t('No tenders found.','ಟೆಂಡರ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.')}</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="tenders-grid">
          {filtered.map(tender => (
            <Link key={tender.id} to={`/tenders/${tender.id}`} className="card tender-card">
              <div className="tender-card-top">
                <div style={{ flex: 1 }}>
                  <div className="tender-card-ref">{tender.reference_number || `KAR-TND-${tender.id}`}</div>
                  <div className="tender-card-title">{tender.title}</div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--muted)', marginTop: 2, flexShrink: 0 }} />
              </div>

              <div className="tender-card-meta">
                <span><Building size={12} />{tender.department}</span>
                {tender.district && <span><MapPin size={12} />{tender.district}</span>}
                {tender.estimated_value && (
                  <span><IndianRupee size={12} />₹{(tender.estimated_value / 10000000).toFixed(2)} {t('Cr','ಕೋ')}</span>
                )}
              </div>

              <div className="tender-card-footer">
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {tender.criteria_count ?? 0} {t('criteria','ನಿಕಷಗಳು')} · {tender.bidder_count ?? 0} {t('bidders','ಬಿಡ್ಡರ್‌ಗಳು')}
                </span>
                {statusBadge(tender.status)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
