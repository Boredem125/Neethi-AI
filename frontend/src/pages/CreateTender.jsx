import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, ChevronRight, X } from 'lucide-react';
import { createTender, uploadTenderDocument, extractCriteria } from '../api/client';
import { useLang } from '../App';

export default function CreateTender() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = (en, kn) => lang === 'KN' ? kn : en;

  const [formData, setFormData] = useState({
    title: '',
    reference_number: '',
    department: '',
    district: '',
    estimated_value: 0
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_value' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t('Please upload a tender document.', 'ದಯವಿಟ್ಟು ಟೆಂಡರ್ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Create tender
      const res = await createTender(formData);
      const tenderId = res.data.id;

      // 2. Upload file
      await uploadTenderDocument(tenderId, file);

      // 3. Extract Criteria
      await extractCriteria(tenderId);

      // 4. Navigate
      navigate(`/tenders/${tenderId}`);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.error;
      setError(Array.isArray(detail) ? detail[0].msg : (detail || t('An error occurred.', 'ಒಂದು ದೋಷ ಸಂಭವಿಸಿದೆ.')));
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-heading">
        <div>
          <h2>{t('New Evaluation', 'ಹೊಸ ಮೌಲ್ಯಮಾಪನ')}</h2>
          <p>{t('Create a new tender evaluation case', 'ಹೊಸ ಟೆಂಡರ್ ಮೌಲ್ಯಮಾಪನ ಪ್ರಕರಣವನ್ನು ರಚಿಸಿ')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t('Tender Title', 'ಟೆಂಡರ್ ಶೀರ್ಷಿಕೆ')} *</label>
            <input 
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('e.g., Construction of Primary Health Centre', 'ಉದಾ., ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ ನಿರ್ಮಾಣ')}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 7,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t('Reference Number', 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ')} *</label>
            <input 
              required
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="e.g., PWD/BLR/2026/01"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 7,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t('Department', 'ಇಲಾಖೆ')} *</label>
            <input 
              required
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., PWD"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 7,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t('District', 'ಜಿಲ್ಲೆ')}</label>
            <input 
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="e.g., Bengaluru"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 7,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t('Estimated Value (₹)', 'ಅಂದಾಜು ಮೌಲ್ಯ (₹)')}</label>
            <input 
              type="number"
              min="0"
              name="estimated_value"
              value={formData.estimated_value}
              onChange={handleChange}
              placeholder="0"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 7,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t('Tender Document (PDF)', 'ಟೆಂಡರ್ ದಾಖಲೆ (PDF)')} *</label>
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 8, padding: 30,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg3)', cursor: 'pointer', position: 'relative',
            transition: 'border-color 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--orange)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                opacity: 0, cursor: 'pointer'
              }}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <FileText size={32} style={{ color: 'var(--orange-l)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <UploadCloud size={32} style={{ color: 'var(--muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t('Click or drag file to upload', 'ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಫೈಲ್ ಎಳೆಯಿರಿ')}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t('PDF files up to 50MB', '50MB ವರೆಗಿನ PDF ಫೈಲ್‌ಗಳು')}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
          <button type="button" onClick={() => navigate('/tenders')} className="btn-ghost" style={{ padding: '10px 16px' }}>
            {t('Cancel', 'ರದ್ದುಮಾಡಿ')}
          </button>
          <button type="submit" disabled={loading} className="btn-new-eval" style={{ width: 'auto', padding: '10px 20px', marginTop: 0, opacity: loading ? 0.7 : 1 }}>
            {loading ? t('Creating...', 'ರಚಿಸಲಾಗುತ್ತಿದೆ...') : t('Create & Extract Criteria', 'ರಚಿಸಿ & ನಿಕಷಗಳನ್ನು ಹೊರತೆಗೆಯಿರಿ')}
            {!loading && <ChevronRight size={15} />}
          </button>
        </div>
      </form>
    </div>
  );
}
