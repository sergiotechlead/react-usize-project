import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faSpinner, faXmark, faRulerCombined,
  faFileArrowUp, faBrain, faCode, faCrosshairs,
  faShieldHalved, faMobile, faChartLine, faPalette,
  faLink, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation, Trans } from 'react-i18next';
import { useModel } from '../../context/ModelContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import UsizeForm from '../../UsizeForm';
import './HomePage.css';

const STEP_ICONS  = [faFileArrowUp, faBrain, faCode];
const FEAT_ICONS  = [faCrosshairs, faShieldHalved, faMobile, faChartLine, faPalette, faLink];

function DemoModal({ onClose }) {
  const overlayRef = useRef(null);
  const { t } = useTranslation('home');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{t('modal.title')}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label={t('modal.closeLabel')}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <UsizeForm />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { modelStatus } = useModel();
  const location = useLocation();
  const [demoOpen, setDemoOpen] = useState(false);
  const { t } = useTranslation('home');

  const STEPS    = t('steps.items',    { returnObjects: true });
  const FEATURES = t('features.items', { returnObjects: true });
  const PLANS    = t('pricing.plans',  { returnObjects: true });

  useEffect(() => {
    const id = location.state?.scrollTo;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [location.state]);

  const modelReady = modelStatus === 'ready';

  return (
    <div className="home">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">{t('hero.eyebrow')}</div>
          <h1 className="hero-title">
            {t('hero.title')}<br />
            <span className="hero-accent">{t('hero.titleAccent')}</span>
          </h1>
          <p className="hero-desc">
            <Trans
              i18nKey="home:hero.desc"
              components={{ 1: <strong /> }}
            />
          </p>
          <div className="hero-ctas">
            <button
              className="btn-hero-primary"
              onClick={() => setDemoOpen(true)}
              disabled={!modelReady}
            >
              {modelReady ? (
                <><FontAwesomeIcon icon={faPlay} /> {t('hero.demoBtn')}</>
              ) : (
                <><FontAwesomeIcon icon={faSpinner} spin /> {t('hero.initBtn')}</>
              )}
            </button>
            <Link to="/register" className="btn-hero-secondary">{t('hero.registerBtn')}</Link>
          </div>
          <p className="hero-hint">
            {modelReady ? t('hero.hintReady') : t('hero.hintLoading')}
          </p>
        </div>

        <div className="hero-visual">
          <div className="widget-mockup">
            <div className="mockup-bar"><span /><span /><span /></div>
            <div className="mockup-body">
              <div className="mockup-product">
                <div className="mockup-img-placeholder" />
                <div className="mockup-info">
                  <div className="mockup-line w70" />
                  <div className="mockup-line w45" />
                  <button
                    className={`mockup-cta-btn${modelReady ? '' : ' disabled'}`}
                    onClick={() => modelReady && setDemoOpen(true)}
                  >
                    <FontAwesomeIcon icon={faRulerCombined} />
                    &nbsp;{t('hero.widgetBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="section steps-section" id="como-funciona">
        <div className="section-inner">
          <div className="section-label">{t('steps.label')}</div>
          <h2 className="section-title">{t('steps.title')}</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon-wrap">
                  <FontAwesomeIcon icon={STEP_ICONS[i]} />
                </div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section className="section features-section" id="funcionalidades">
        <div className="section-inner">
          <div className="section-label">{t('features.label')}</div>
          <h2 className="section-title">{t('features.title')}</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap">
                  <FontAwesomeIcon icon={FEAT_ICONS[i]} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Embed snippet ── */}
      <section className="section embed-section">
        <div className="section-inner embed-inner">
          <div className="embed-copy">
            <div className="section-label">{t('embed.label')}</div>
            <h2 className="section-title">{t('embed.title')}</h2>
            <p className="embed-desc">{t('embed.desc')}</p>
            <Link to="/register" className="btn-nav-primary">{t('embed.apiKeyBtn')}</Link>
          </div>
          <div className="embed-code-block">
            <div className="code-bar">
              <span className="code-lang">HTML</span>
            </div>
            <pre className="code-pre"><code>{`<link rel="stylesheet"
  href="https://cdn.usize.app/widget.css">

<div id="usize-widget"></div>

<script src="https://cdn.usize.app/widget.js">
</script>
<script>
  USize.init({
    apiKey: "us_live_••••••••",
    container: "#usize-widget",
    brandColor: "#53a0f8"
  });
</script>`}</code></pre>
          </div>
        </div>
      </section>

      {/* ── Precios ── */}
      <section className="section pricing-section" id="precios">
        <div className="section-inner">
          <div className="section-label">{t('pricing.label')}</div>
          <h2 className="section-title">{t('pricing.title')}</h2>
          <div className="pricing-grid">
            {PLANS.map((p, idx) => (
              <div key={idx} className={`plan-card${idx === 1 ? ' plan-card--highlight' : ''}`}>
                {idx === 1 && <div className="plan-badge">{t('pricing.popular')}</div>}
                <h3 className="plan-name">{p.name}</h3>
                <div className="plan-price">
                  {p.price}<span className="plan-period">{p.period}</span>
                </div>
                <p className="plan-limit">{p.limit}</p>
                <ul className="plan-features">
                  {p.features.map(f => (
                    <li key={f}>
                      <FontAwesomeIcon icon={faCheck} className="plan-check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={idx === 2 ? '/contact' : '/register'}
                  className={`plan-cta${idx === 1 ? ' plan-cta--primary' : ''}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="pricing-more">
            <Link to="/pricing" className="btn-nav-ghost">{t('pricing.morePlans')}</Link>
          </div>
        </div>
      </section>

      <Footer />

      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </div>
  );
}
