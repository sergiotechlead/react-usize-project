import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faChevronRight, faGlobe, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LANGS } from '../i18n/langs';
import './Navbar.css';

function LangSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  function changeLang(code) {
    i18n.changeLanguage(code);
    localStorage.setItem('usize-lang', code);
    setOpen(false);
  }

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="lang-selector" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FontAwesomeIcon icon={faGlobe} />
        <span>{current.short}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`lang-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <ul className="lang-dropdown" role="listbox">
          {LANGS.map(lang => (
            <li key={lang.code} role="option" aria-selected={lang.code === current.code}>
              <button
                className={`lang-option${lang.code === current.code ? ' active' : ''}`}
                onClick={() => changeLang(lang.code)}
              >
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Navbar({ activePage }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('common');

  function scrollToSection(id) {
    setOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <div className="brand-logo">
            <span className="brand-logo-letter">U</span>
          </div>
          <span className="navbar-brand-name">USize</span>
        </Link>

        <ul className={`navbar-links${open ? ' is-open' : ''}`}>
          <li>
            <button className="nav-scroll-btn" onClick={() => scrollToSection('como-funciona')}>
              {t('nav.howItWorks')}
            </button>
          </li>
          <li>
            <Link to="/docs" className={activePage === 'docs' ? 'is-active' : ''} onClick={() => setOpen(false)}>
              {t('nav.docs')}
            </Link>
          </li>
          <li>
            <Link to="/pricing" className={activePage === 'pricing' ? 'is-active' : ''} onClick={() => setOpen(false)}>
              {t('nav.pricing')}
            </Link>
          </li>
        </ul>

        <div className="navbar-actions">
          <LangSelector />
          {user ? (
            <button className="btn-nav-primary" onClick={() => { navigate('/dashboard'); setOpen(false); }}>
              {t('nav.dashboard')} <FontAwesomeIcon icon={faChevronRight} />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-nav-ghost" onClick={() => setOpen(false)}>{t('nav.login')}</Link>
              <Link to="/register" className="btn-nav-primary" onClick={() => setOpen(false)}>{t('nav.register')}</Link>
            </>
          )}
          <button className="navbar-toggle" onClick={() => setOpen(v => !v)} aria-label={t('nav.toggleMenu')}>
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </button>
        </div>
      </div>
    </nav>
  );
}
