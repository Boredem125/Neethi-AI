import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../App';
import {
  LayoutDashboard, FileCheck, FileText, BarChart2, Archive,
  Plus, HelpCircle, LogOut, Search, Bell, Settings, User, Globe,
} from 'lucide-react';

const navItems = [
  { path: '/',        labelEN: 'Dashboard',   labelKN: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',    icon: LayoutDashboard },
  { path: '/tenders', labelEN: 'Evaluations', labelKN: 'ಮೌಲ್ಯಮಾಪನಗಳು',     icon: FileCheck },
  { path: '/review',  labelEN: 'Review Queue',labelKN: 'ಪರಿಶೀಲನಾ ಸರತಿ',   icon: FileText },
  { path: '/audit',   labelEN: 'Analytics',   labelKN: 'ವಿಶ್ಲೇಷಣೆ',         icon: BarChart2 },
  { path: '/audit',   labelEN: 'Archive',     labelKN: 'ಆರ್ಕೈವ್',            icon: Archive },
];

export default function Layout({ children }) {
  const { lang, setLang } = useLang();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('lang-kn', lang === 'KN');
  }, [lang]);

  const t = (en, kn) => lang === 'KN' ? kn : en;

  return (
    <div className="app-shell">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>{t('Command Center', 'ಕಮಾಂಡ್ ಸೆಂಟರ್')}</h1>
          <p>{t('Tender Evaluation Unit', 'ಟೆಂಡರ್ ಮೌಲ್ಯಮಾಪನ ಘಟಕ')}</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, labelEN, labelKN, icon: Icon }, i) => {
            const active = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
              <Link key={i} to={path} className={`nav-link ${active ? 'active' : ''}`}>
                <Icon />
                {t(labelEN, labelKN)}
              </Link>
            );
          })}

          <Link to="/tenders/new" className="btn-new-eval">
            <Plus size={15} />
            {t('New Evaluation', 'ಹೊಸ ಮೌಲ್ಯಮಾಪನ')}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-footer-btn">
            <HelpCircle /> {t('Support', 'ಸಹಾಯ')}
          </button>
          <button className="sidebar-footer-btn">
            <LogOut /> {t('Logout', 'ಲಾಗ್‌ಔಟ್')}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="main-area">

        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-brand">
              Tender<span className="orange">Command</span>
            </div>
            <div className="status-pill">
              <span className="status-dot" />
              {t('System Active', 'ವ್ಯವಸ್ಥೆ ಸಕ್ರಿಯ')}
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search className="search-icon" />
              <input type="text" placeholder={t('Search parameters...', 'ಹುಡುಕಿ...')} />
            </div>

            <div className="topbar-actions">
              <button className="lang-btn" onClick={() => setLang(l => l === 'EN' ? 'KN' : 'EN')}>
                <Globe size={14} />
                {lang}
              </button>

              <button className="icon-btn">
                <Bell />
                <span className="notif-badge" />
              </button>

              <button className="icon-btn">
                <Settings />
              </button>

              <div className="avatar-btn">
                <User />
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
