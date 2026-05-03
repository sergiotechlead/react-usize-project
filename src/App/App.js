import { useState, useEffect, useRef } from 'react';
import UsizeForm from '../UsizeForm';
import TrainingModel from '../TrainingModel';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const overlayRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) closeModal();
  }

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <span className="brand-logo-letter">U</span>
          </div>
          <div>
            <h1 className="brand-name">USize</h1>
            <p className="brand-tagline">AI Size Predictor</p>
          </div>
        </div>
        <span className="ai-badge">⚡ Powered by TensorFlow.js</span>
      </header>

      <main className="app-main">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-eyebrow">Machine Learning · Fashion Tech</div>
            <h2 className="hero-title">
              Encuentra tu talla perfecta
              <span className="hero-title-accent"> con IA</span>
            </h2>
            <p className="hero-description">
              Ingresa tus medidas y nuestra red neuronal predice tu talla ideal al instante.
            </p>
            <button className="cta-button" onClick={openModal}>
              <span className="cta-icon">📏</span>
              ¿Cuál es mi talla?
              <span className="beta-tag">BETA</span>
            </button>
          </div>

          <div className="hero-visual">
            <div className="size-grid">
              {[
                { size: 'XS', range: '< 41 cm' },
                { size: 'S',  range: '41–44 cm', active: true },
                { size: 'M',  range: '45–48 cm', active: true },
                { size: 'L',  range: '49–52 cm' },
                { size: 'XL', range: '53+ cm' },
              ].map(({ size, range, active }) => (
                <div key={size} className={`size-card${active ? ' size-card--active' : ''}`}>
                  <span className="size-label">{size}</span>
                  <span className="size-range">{range}</span>
                </div>
              ))}
            </div>
            <p className="visual-note">* Rango por ancho de espalda</p>
          </div>
        </section>

        <TrainingModel />
      </main>

      <footer className="app-footer">
        <p>USize — AI Size Predictor &copy; 2024 · Built with React &amp; TensorFlow.js</p>
      </footer>

      {isModalOpen && (
        <div
          className="modal-backdrop"
          ref={overlayRef}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Predictor de talla"
        >
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Predictor de Talla</h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <UsizeForm />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
