import { useState, useEffect } from 'react';
import { getReviewQueue, submitReview } from '../api/client';
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useLang } from '../App';

export default function ReviewQueue() {
  const { lang } = useLang();
  const t = (en, kn) => lang === 'KN' ? kn : en;

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes,   setNotes]   = useState({});

  useEffect(() => {
    getReviewQueue()
      .then(r => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (verdictId, decision) => {
    try {
      await submitReview(verdictId, { decision, notes: notes[verdictId] || '' });
      setItems(prev => prev.filter(i => i.id !== verdictId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div>
          <h2>{t('Review Queue','ಪರಿಶೀಲನಾ ಸರತಿ')}</h2>
          <p>{t('Cases flagged for manual officer review','ಕೈಚಾಲಿತ ಅಧಿಕಾರಿ ಪರಿಶೀಲನೆಗಾಗಿ ಗುರುತಿಸಲಾದ ಪ್ರಕರಣಗಳು')}</p>
        </div>
        {!loading && (
          <span className="badge badge-review" style={{ fontSize: 12, padding: '6px 12px' }}>
            {items.length} {t('Pending','ಬಾಕಿ')}
          </span>
        )}
      </div>

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px', borderRadius: 8, marginBottom: 20,
        background: 'rgba(255,152,0,0.07)', border: '1px solid rgba(255,152,0,0.18)'
      }}>
        <AlertTriangle size={16} style={{ color: 'var(--orange)', marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          {t(
            'KTPP §14 Non-Silent Disqualification — every ambiguous case gets human review before a final verdict is recorded.',
            'KTPP §14 ಮೌನ-ರಹಿತ ಅನರ್ಹತೆ — ಪ್ರತಿ ಅಸ್ಪಷ್ಟ ಪ್ರಕರಣಕ್ಕೆ ಅಂತಿಮ ತೀರ್ಪು ನೋಂದಾಯಿಸುವ ಮೊದಲು ಮಾನವ ಪರಿಶೀಲನೆ ನಡೆಯಲಿದೆ.'
          )}
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0,1].map(i => <div key={i} className="shimmer" style={{ height: 160 }} />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <CheckCircle size={40} style={{ color: 'var(--green)', opacity: 1 }} />
            <p style={{ fontWeight: 600, color: 'var(--green)' }}>{t('All clear!','ಎಲ್ಲವೂ ಸ್ಪಷ್ಟ!')}</p>
            <p>{t('No items pending manual review.','ಕೈಚಾಲಿತ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇಲ್ಲ.')}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div key={item.id} className="card review-card">
            <div className="review-card-header">
              <div>
                <div className="review-title">
                  {item.criterion_name || t('Criterion Review','ನಿಕಷ ಪರಿಶೀಲನೆ')}
                  {item.mandatory && (
                    <span className="badge badge-not" style={{ marginLeft: 8, fontSize: 9 }}>
                      {t('mandatory','ಕಡ್ಡಾಯ')}
                    </span>
                  )}
                </div>
                <div className="review-sub">
                  {item.company_name} · {item.tender_reference || `Tender #${item.tender_id}`}
                </div>
              </div>
              <span className="badge badge-review">
                <AlertTriangle size={10} /> {t('Manual Review','ಕೈಪರಿಶೀಲನೆ')}
              </span>
            </div>

            <div className="review-reason">
              {item.reasoning || t('Reasoning not available.','ವಿವರಣೆ ಲಭ್ಯವಿಲ್ಲ.')}
            </div>

            <div className="review-confidence">
              {t('Extracted','ಹೊರತೆಗೆದ')}: <span style={{ color: 'var(--text)' }}>{item.extracted_value || '—'}</span>
              {'  ·  '}
              {t('Confidence','ವಿಶ್ವಾಸ')}: <span>{item.confidence_score ? `${(item.confidence_score * 100).toFixed(0)}%` : '—'}</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <textarea
                value={notes[item.id] || ''}
                onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                placeholder={t('Add officer notes (optional)...','ಅಧಿಕಾರಿಯ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)...')}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 7,
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 12, resize: 'vertical',
                  minHeight: 64, outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div className="review-actions">
              <button className="btn-approve" onClick={() => handleReview(item.id, 'approve')}>
                <CheckCircle size={14} /> {t('Approve','ಅನುಮೋದಿಸಿ')}
              </button>
              <button className="btn-reject" onClick={() => handleReview(item.id, 'reject')}>
                <XCircle size={14} /> {t('Reject','ತಿರಸ್ಕರಿಸಿ')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
