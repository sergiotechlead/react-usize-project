import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faBook, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="notfound-page">
      <Navbar />
      <main className="notfound-main">
        <div className="notfound-content">
          <p className="notfound-code">404</p>
          <h1 className="notfound-title">Página no encontrada</h1>
          <p className="notfound-desc">
            La página que buscas no existe o fue movida a otra dirección.
          </p>
          <div className="notfound-actions">
            <Link to="/" className="btn-notfound-primary">
              <FontAwesomeIcon icon={faHouse} /> Volver al inicio
            </Link>
            <Link to="/docs" className="btn-notfound-secondary">
              <FontAwesomeIcon icon={faBook} /> Documentación
            </Link>
            <a href="mailto:soporte@usize.app" className="btn-notfound-secondary">
              <FontAwesomeIcon icon={faEnvelope} /> Contactar soporte
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
