import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Plus, Play, FileText, UploadCloud } from 'lucide-react';
import { getTender, getBidders, extractCriteria, evaluateTender, createBidder, uploadBidderDocument, getTenderVerdicts, awardBidder } from '../api/client';
import { useLang } from '../App';

export default function TenderDetail() {
  const { id } = useParams();
  const { lang } = useLang();
  const t = (en, kn) => lang === 'KN' ? kn : en;

  const [tender,  setTender]  = useState(null);
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const [showAddBidder, setShowAddBidder] = useState(false);
  const [newBidder, setNewBidder] = useState({ company_name: '', category: 'general' });
  const [bidderFile, setBidderFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleExtract = async () => {
    setActionLoading(true);
    try { await extractCriteria(id); window.location.reload(); }
    catch (e) { alert(t('Failed to extract criteria.', 'ನಿಕಷ ಹೊರತೆಗೆಯಲು ವಿಫಲವಾಗಿದೆ.')); setActionLoading(false); }
  };

  const handleEvaluate = async () => {
    setActionLoading(true);
    try { await evaluateTender(id); window.location.reload(); }
    catch (e) { alert(t('Failed to evaluate.', 'ಮೌಲ್ಯಮಾಪನ ವಿಫಲವಾಗಿದೆ.')); setActionLoading(false); }
  };

  const handleAddBidder = async (e) => {
    e.preventDefault();
    if (!bidderFile) return;
    setActionLoading(true);
    try {
      const res = await createBidder(id, newBidder);
      await uploadBidderDocument(res.data.id, bidderFile);
      window.location.reload();
    } catch (e) {
      alert(t('Failed to add bidder.', 'ಬಿಡ್ಡರ್ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ.'));
      setActionLoading(false);
    }
  };

  const handleAward = async (bidderId) => {
    if (!window.confirm(t('Are you sure you want to award this tender to this bidder?', 'ಈ ಟೆಂಡರ್ ಅನ್ನು ಈ ಬಿಡ್ಡರ್‌ಗೆ ನೀಡಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'))) return;
    setActionLoading(true);
    try {
      await awardBidder(bidderId);
      window.location.reload();
    } catch (e) {
      alert(t('Failed to award bidder.', 'ಬಿಡ್ಡರ್ ಪ್ರಶಸ್ತಿ ನೀಡಲು ವಿಫಲವಾಗಿದೆ.'));
      setActionLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getTender(id), getBidders(id), getTenderVerdicts(id)])
      .then(([tr, br, vr]) => { 
        setTender(tr.data); 
        
        // Attach verdicts to bidders
        const biddersWithVerdicts = br.data.map(b => ({
          ...b,
          verdicts: vr.data.filter(v => v.bidder_id === b.id)
        }));
        setBidders(biddersWithVerdicts); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div>
      <div className="shimmer" style={{ height: 120, marginBottom: 16 }} />
      <div className="shimmer" style={{ height: 300 }} />
    </div>
  );

  if (!tender) return (
    <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
      {t('Tender not found.', 'ಟೆಂಡರ್ ಕಂಡುಬಂದಿಲ್ಲ.')}
    </div>
  );

  const verdictIcon = (status) => {
    if (status === 'ELIGIBLE')      return <CheckCircle size={16} style={{ color: 'var(--green)'  }} />;
    if (status === 'NOT_ELIGIBLE')  return <XCircle     size={16} style={{ color: 'var(--red)'    }} />;
    return                                 <AlertTriangle size={16} style={{ color: 'var(--orange)' }} />;
  };

  const verdictBadge = (status) => {
    if (status === 'ELIGIBLE')     return <span className="badge badge-eligible">{t('Eligible','ಅರ್ಹ')}</span>;
    if (status === 'NOT_ELIGIBLE') return <span className="badge badge-not">{t('Not Eligible','ಅನರ್ಹ')}</span>;
    return                                <span className="badge badge-review">{t('Manual Review','ಕೈಪರಿಶೀಲನೆ')}</span>;
  };

  return (
    <div>
      {/* Back */}
      <Link to="/tenders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 20, transition: 'color 0.15s' }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseOut={e  => e.currentTarget.style.color = 'var(--muted)'}>
        <ArrowLeft size={14} /> {t('Back to Evaluations','ಮೌಲ್ಯಮಾಪನಗಳಿಗೆ ಹಿಂತಿರುಗಿ')}
      </Link>

      {/* Awarded Banner */}
      {bidders.find(b => b.is_awarded) && (
        <div className="card" style={{ padding: '16px 24px', marginBottom: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid var(--green)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle size={20} style={{ color: 'var(--green)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {t('Tender Awarded to', 'ಟೆಂಡರ್ ನೀಡಲಾಗಿದೆ')}: {bidders.find(b => b.is_awarded).company_name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {t('The evaluation phase is now closed.', 'ಮೌಲ್ಯಮಾಪನ ಹಂತ ಈಗ ಮುಕ್ತಾಯಗೊಂಡಿದೆ.')}
            </div>
          </div>
        </div>
      )}

      {/* Tender Header */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--orange-l)', fontWeight: 600, marginBottom: 4 }}>
              {tender.reference_number}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>{tender.title}</h2>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span>{tender.department}</span>
              {tender.district && <span>{tender.district}</span>}
              {tender.estimated_value && <span>₹{(tender.estimated_value / 10000000).toFixed(2)} Cr</span>}
            </div>
          </div>
          <span className={`badge ${
            tender.status === 'evaluated'          ? 'badge-completed' :
            tender.status === 'accepting_bids'     ? 'badge-draft' :
            tender.status === 'criteria_extracted' ? 'badge-evaluating' : 'badge-review'
          }`} style={{ flexShrink: 0 }}>
            {tender.status?.replace(/_/g,' ').toUpperCase()}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button onClick={handleExtract} disabled={actionLoading} className="btn-ghost" style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6, opacity: actionLoading ? 0.5 : 1 }}>
            <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {t('Extract Criteria', 'ನಿಕಷ ಹೊರತೆಗೆಯಿರಿ')}
          </button>
          <button onClick={handleEvaluate} disabled={actionLoading || bidders.length === 0} className="btn-ghost print-hide" style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6, opacity: (actionLoading || bidders.length === 0) ? 0.5 : 1 }}>
            <Play size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {t('Evaluate Bidders', 'ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ')}
          </button>
          {tender.status === 'EVALUATED' || tender.status === 'evaluated' ? (
            <>
              <button onClick={() => window.print()} className="btn-ghost print-hide" style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6 }}>
                <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {t('Generate Report', 'ವರದಿ ರಚಿಸಿ')}
              </button>
              <button onClick={() => alert(t('Modification request sent to department.', 'ಮಾರ್ಪಾಡು ವಿನಂತಿಯನ್ನು ಇಲಾಖೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.'))} className="btn-ghost print-hide" style={{ padding: '8px 14px', background: 'rgba(255,152,0,0.1)', color: 'var(--orange-l)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: 6 }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {t('Request Modification', 'ಮಾರ್ಪಾಡು ವಿನಂತಿಸಿ')}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Criteria Section */}
      {tender.criteria && tender.criteria.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">{t('Extracted Criteria', 'ಹೊರತೆಗೆದ ನಿಕಷಗಳು')}</span>
            <span className="card-meta">{tender.criteria.length} {t('criteria', 'ನಿಕಷಗಳು')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {tender.criteria.map(c => (
              <div key={c.id} style={{ padding: 16, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                  {c.is_mandatory && <span className="badge badge-review" style={{ fontSize: 10 }}>{t('Mandatory', 'ಕಡ್ಡಾಯ')}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{c.description}</div>
                <div style={{ fontSize: 11, color: 'var(--orange-l)' }}>
                  {c.threshold_operator} {c.threshold_value} {c.threshold_unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bidders */}
      <div className="card" style={{ padding: 24 }}>
        <div className="card-header">
          <div>
            <span className="card-title" style={{ marginRight: 10 }}>{t('Bidder Evaluations','ಬಿಡ್ಡರ್ ಮೌಲ್ಯಮಾಪನಗಳು')}</span>
            <span className="card-meta">{bidders.length} {t('bidders','ಬಿಡ್ಡರ್‌ಗಳು')}</span>
          </div>
          <button onClick={() => setShowAddBidder(!showAddBidder)} className="btn-new-eval" style={{ width: 'auto', padding: '6px 12px', fontSize: 11, marginTop: 0 }}>
            <Plus size={14} /> {t('Add Bidder', 'ಬಿಡ್ಡರ್ ಸೇರಿಸಿ')}
          </button>
        </div>

        {showAddBidder && (
          <form onSubmit={handleAddBidder} style={{ padding: 16, marginBottom: 20, background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 12, marginBottom: 12 }}>{t('Register New Bidder', 'ಹೊಸ ಬಿಡ್ಡರ್ ನೋಂದಾಯಿಸಿ')}</h4>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <input 
                required placeholder={t('Company Name', 'ಕಂಪನಿ ಹೆಸರು')}
                value={newBidder.company_name} onChange={e => setNewBidder({...newBidder, company_name: e.target.value})}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, outline: 'none' }}
              />
              <select 
                value={newBidder.category} onChange={e => setNewBidder({...newBidder, category: e.target.value})}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, outline: 'none' }}>
                <option value="general">General</option>
                <option value="sc">SC</option>
                <option value="st">ST</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="file" accept=".pdf" required onChange={e => setBidderFile(e.target.files[0])} style={{ fontSize: 11 }} />
              <button type="submit" disabled={actionLoading} className="btn-new-eval" style={{ width: 'auto', padding: '6px 12px', fontSize: 11, marginTop: 0, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? t('Adding...', 'ಸೇರಿಸಲಾಗುತ್ತಿದೆ...') : t('Save Bidder', 'ಉಳಿಸಿ')}
              </button>
            </div>
          </form>
        )}

        {bidders.length === 0 && (
          <div className="empty-state">
            <p>{t('No bidders registered yet.','ಇನ್ನೂ ಯಾವ ಬಿಡ್ಡರ್‌ಗಳು ನೋಂದಾಯಿಸಿಲ್ಲ.')}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bidders.map(bidder => {
            const isOpen = expanded === bidder.id;
            const verdicts = bidder.verdicts || [];
            const overall = bidder.overall_status;

            return (
              <div key={bidder.id} className="card" style={{ border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : bidder.id)}
                  style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {verdictIcon(overall)}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bidder.company_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{bidder.registration_number}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {bidder.overall_score !== undefined && bidder.overall_score !== null && (
                      <div className="circular-progress" style={{ 
                        '--prog-deg': `${bidder.overall_score * 3.6}deg`,
                        '--prog-color': bidder.overall_score >= 80 ? 'var(--green)' : bidder.overall_score >= 50 ? 'var(--orange-l)' : 'var(--red)',
                        width: '36px', height: '36px' 
                      }}>
                        <span className="circular-progress-value" style={{ fontSize: 10 }}>{Math.round(bidder.overall_score)}%</span>
                      </div>
                    )}
                    {verdictBadge(overall)}
                    {isOpen ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
                  </div>
                </button>

                {isOpen && verdicts.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0 12px 10px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                            {t('Criterion','ನಿಕಷ')}
                          </th>
                          <th style={{ textAlign: 'left', padding: '0 12px 10px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                            {t('Extracted Value','ಹೊರತೆಗೆದ ಮೌಲ್ಯ')}
                          </th>
                          <th style={{ textAlign: 'left', padding: '0 12px 10px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                            {t('Verdict','ತೀರ್ಪು')}
                          </th>
                          <th style={{ textAlign: 'left', padding: '0 0 10px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                            {t('Confidence','ವಿಶ್ವಾಸ')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {verdicts.map(v => (
                          <tr key={v.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 12px 10px 0', color: 'var(--text)' }}>{v.criterion_name || `Criterion ${v.criterion_id}`}</td>
                            <td style={{ padding: '10px 12px 10px 0', color: 'var(--muted)' }}>{v.extracted_value || '—'}</td>
                            <td style={{ padding: '10px 12px 10px 0' }}>{verdictBadge(v.status)}</td>
                            <td style={{ padding: '10px 0', color: v.confidence_score >= 0.8 ? 'var(--green)' : v.confidence_score >= 0.6 ? 'var(--orange-l)' : 'var(--red)' }}>
                              {v.confidence_score ? `${(v.confidence_score * 100).toFixed(0)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Award Button inside expanded view */}
                    {overall === 'ELIGIBLE' && !bidders.find(b => b.is_awarded) && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAward(bidder.id); }}
                          className="btn-new-eval" 
                          style={{ width: 'auto', padding: '8px 16px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                          {t('Award Tender to this Bidder', 'ಈ ಬಿಡ್ಡರ್‌ಗೆ ಟೆಂಡರ್ ನೀಡಿ')}
                        </button>
                      </div>
                    )}

                    {bidder.is_awarded && (
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', color: 'var(--green)', fontWeight: 700, fontSize: 13, alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={16} /> {t('WINNING BIDDER', 'ವಿಜೇತ ಬಿಡ್ಡರ್')}
                      </div>
                    )}
                  </div>
                )}
                {isOpen && verdicts.length === 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: bidder.is_awarded ? 16 : 0 }}>
                      {t('No verdicts issued yet.','ಇನ್ನೂ ಯಾವ ತೀರ್ಪು ನೀಡಿಲ್ಲ.')}
                    </div>
                    {bidder.is_awarded && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--green)', fontWeight: 700, fontSize: 13, alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={16} /> {t('WINNING BIDDER', 'ವಿಜೇತ ಬಿಡ್ಡರ್')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
