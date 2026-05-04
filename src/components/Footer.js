import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

export default function Footer() {
  const navigate  = useNavigate();
  const location  = useLocation();

  function scrollToSection(id) {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  }

  function goToDocsSection(section) {
    navigate('/docs', { state: { section } });
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand">
            <div className="brand-logo sm">
              <span className="brand-logo-letter">U</span>
            </div>
            <span className="footer-brand-name">USize</span>
          </Link>
          <p className="footer-tagline">
            El widget de predicción de tallas con IA para tu tienda de moda.
          </p>
          <a
            href="https://github.com/Serbeld/"
            className="footer-social"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>

        <div className="footer-links-group">
          <h4>Producto</h4>
          <ul>
            <li><button className="footer-link-btn" onClick={() => scrollToSection('como-funciona')}>Cómo funciona</button></li>
            <li><button className="footer-link-btn" onClick={() => scrollToSection('funcionalidades')}>Funcionalidades</button></li>
            <li><Link to="/pricing">Precios</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Recursos</h4>
          <ul>
            <li><Link to="/docs">Documentación</Link></li>
            <li><button className="footer-link-btn" onClick={() => goToDocsSection('api')}>Referencia API</button></li>
            <li><button className="footer-link-btn" onClick={() => goToDocsSection('faq')}>FAQ</button></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Cuenta</h4>
          <ul>
            <li><Link to="/login">Iniciar sesión</Link></li>
            <li><Link to="/register">Registrarse</Link></li>
            <li><Link to="/contact">Contacto</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} USize · Construido con React &amp; TensorFlow.js</p>
      </div>
    </footer>
  );
}
