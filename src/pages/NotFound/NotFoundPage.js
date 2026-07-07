import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faBook, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { usePageTitle } from '../../hooks/usePageTitle';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const { t } = useTranslation('notfound');
  usePageTitle(t('pageTitle'));
  return (
    <div className="notfound-page">
      <Navbar />
      <main className="notfound-main" id="main-content">
        <div className="notfound-content">
          <p className="notfound-code">404</p>
          <h1 className="notfound-title">{t('title')}</h1>
          <p className="notfound-desc">{t('desc')}</p>
          <div className="notfound-actions">
            <Link to="/" className="btn-notfound-primary">
              <FontAwesomeIcon icon={faHouse} /> {t('home')}
            </Link>
            <Link to="/docs" className="btn-notfound-secondary">
              <FontAwesomeIcon icon={faBook} /> {t('docs')}
            </Link>
            <a href="mailto:soporte@usize.app" className="btn-notfound-secondary">
              <FontAwesomeIcon icon={faEnvelope} /> {t('contact')}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
