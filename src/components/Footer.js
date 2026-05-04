import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { useTranslation } from 'react-i18next';
import './Footer.css';

export default function Footer() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t } = useTranslation('common');

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
          <p className="footer-tagline">{t('footer.tagline')}</p>
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
          <h4>{t('footer.groups.product')}</h4>
          <ul>
            <li><button className="footer-link-btn" onClick={() => scrollToSection('como-funciona')}>{t('footer.links.howItWorks')}</button></li>
            <li><button className="footer-link-btn" onClick={() => scrollToSection('funcionalidades')}>{t('footer.links.features')}</button></li>
            <li><Link to="/pricing">{t('footer.links.pricing')}</Link></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>{t('footer.groups.resources')}</h4>
          <ul>
            <li><Link to="/docs">{t('footer.links.docs')}</Link></li>
            <li><button className="footer-link-btn" onClick={() => goToDocsSection('api')}>{t('footer.links.apiRef')}</button></li>
            <li><button className="footer-link-btn" onClick={() => goToDocsSection('faq')}>{t('footer.links.faq')}</button></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>{t('footer.groups.account')}</h4>
          <ul>
            <li><Link to="/login">{t('footer.links.login')}</Link></li>
            <li><Link to="/register">{t('footer.links.register')}</Link></li>
            <li><Link to="/contact">{t('footer.links.contact')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} USize · {t('footer.builtWith')}</p>
      </div>
    </footer>
  );
}
