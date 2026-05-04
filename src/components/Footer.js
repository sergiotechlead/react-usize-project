import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

export default function Footer() {
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
            <li><a href="/#como-funciona">Cómo funciona</a></li>
            <li><a href="/#funcionalidades">Funcionalidades</a></li>
            <li><Link to="/pricing">Precios</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Recursos</h4>
          <ul>
            <li><Link to="/docs">Documentación</Link></li>
            <li><Link to="/docs#api">Referencia API</Link></li>
            <li><Link to="/docs#faq">FAQ</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Cuenta</h4>
          <ul>
            <li><Link to="/login">Iniciar sesión</Link></li>
            <li><Link to="/register">Registrarse</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} USize · Construido con React &amp; TensorFlow.js</p>
      </div>
    </footer>
  );
}
