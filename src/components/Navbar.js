import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ activePage }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

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
              Cómo funciona
            </button>
          </li>
          <li>
            <Link to="/docs" className={activePage === 'docs' ? 'is-active' : ''} onClick={() => setOpen(false)}>
              Documentación
            </Link>
          </li>
          <li>
            <Link to="/pricing" className={activePage === 'pricing' ? 'is-active' : ''} onClick={() => setOpen(false)}>
              Precios
            </Link>
          </li>
        </ul>

        <div className="navbar-actions">
          {user ? (
            <button className="btn-nav-primary" onClick={() => { navigate('/dashboard'); setOpen(false); }}>
              Dashboard <FontAwesomeIcon icon={faChevronRight} />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-nav-ghost" onClick={() => setOpen(false)}>Iniciar sesión</Link>
              <Link to="/register" className="btn-nav-primary" onClick={() => setOpen(false)}>Empezar gratis</Link>
            </>
          )}
          <button className="navbar-toggle" onClick={() => setOpen(v => !v)} aria-label="Menú">
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </button>
        </div>
      </div>
    </nav>
  );
}
