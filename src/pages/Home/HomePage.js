import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModel } from '../../context/ModelContext';
import UsizeForm from '../../UsizeForm';
import './HomePage.css';

const STEPS = [
  { icon: '📊', title: 'Sube tus datos', desc: 'Descarga la plantilla Excel, rellénala con las medidas y tallas de tu marca, y cárgala en el dashboard.' },
  { icon: '🧠', title: 'Entrena tu modelo', desc: 'Nuestra IA aprende los patrones de tu marca en segundos, directamente en el navegador. Sin servidores externos.' },
  { icon: '⚡', title: 'Integra y listo', desc: 'Copia dos líneas de código en tu tienda. Tus clientes encontrarán su talla perfecta en tiempo real.' },
];

const FEATURES = [
  { icon: '🎯', title: 'Predicción precisa', desc: 'Red neuronal con 4 variables de entrada y más del 94 % de accuracy en datos de prueba.' },
  { icon: '🔒', title: 'Datos privados', desc: 'El modelo se entrena en el navegador del usuario. Ningún dato personal sale de su dispositivo.' },
  { icon: '📱', title: 'Responsive', desc: 'El widget se adapta a cualquier tienda: Shopify, WooCommerce, Vtex o HTML puro.' },
  { icon: '📈', title: 'Analytics en tiempo real', desc: 'Monitorea cuántas predicciones se realizan, distribución de tallas y tendencias por período.' },
  { icon: '🎨', title: 'Personalizable', desc: 'Ajusta colores, textos y estilos del widget para que coincida perfectamente con tu marca.' },
  { icon: '🔗', title: 'Fácil integración', desc: 'Un script tag y un div. Sin frameworks requeridos. Funciona en cualquier stack.' },
];

const PLANS = [
  { name: 'Starter', price: 'Gratis', limit: '500 predicciones/mes', features: ['1 modelo', 'Widget estándar', 'Soporte por email'], cta: 'Empezar gratis', highlight: false },
  { name: 'Pro',     price: '$29',    limit: '10 000 predicciones/mes', period: '/mes', features: ['3 modelos', 'Widget personalizado', 'Analytics avanzado', 'Soporte prioritario'], cta: 'Probar Pro', highlight: true },
  { name: 'Enterprise', price: 'Custom', limit: 'Predicciones ilimitadas', features: ['Modelos ilimitados', 'Branding propio', 'SLA 99.9 %', 'Manager dedicado'], cta: 'Contactar ventas', highlight: false },
];

function DemoModal({ onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-backdrop" ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">Predictor de Talla</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <UsizeForm />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { modelStatus } = useModel();
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

  const modelReady = modelStatus === 'ready';

  return (
    <div className="home">
      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="nav-brand">
          <div className="brand-logo"><span className="brand-logo-letter">U</span></div>
          <span className="nav-brand-name">USize</span>
        </div>
        <ul className="nav-links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#funcionalidades">Funcionalidades</a></li>
          <li><a href="#precios">Precios</a></li>
        </ul>
        <div className="nav-actions">
          {user ? (
            <button className="btn-nav-primary" onClick={() => navigate('/dashboard')}>
              Ir al Dashboard →
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-nav-ghost">Iniciar sesión</Link>
              <Link to="/login" className="btn-nav-primary">Empezar gratis →</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Fashion Tech · Machine Learning · SaaS</div>
          <h1 className="hero-title">
            Tu widget de tallas con IA,<br />
            <span className="hero-accent">listo en 5 minutos</span>
          </h1>
          <p className="hero-desc">
            Entrena un modelo con los datos de tu marca, incrusta dos líneas de código
            y reduce las devoluciones por talla hasta un&nbsp;<strong>40 %</strong>.
          </p>
          <div className="hero-ctas">
            <button
              className="btn-hero-primary"
              onClick={() => setDemoOpen(true)}
              disabled={!modelReady}
            >
              {modelReady ? '🎯 Ver demo en vivo' : <><span className="loading-spinner sm" /> Inicializando IA...</>}
            </button>
            <Link to="/login" className="btn-hero-secondary">Crear cuenta gratis</Link>
          </div>
          <p className="hero-hint">
            {modelReady
              ? '✓ Modelo pre-entrenado cargado — sin registro necesario'
              : 'Entrenando modelo base en segundo plano…'}
          </p>
        </div>
        <div className="hero-visual">
          <div className="widget-mockup">
            <div className="mockup-bar">
              <span /><span /><span />
            </div>
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
                    📏 ¿Cuál es mi talla?
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
          <div className="section-label">Proceso</div>
          <h2 className="section-title">Tres pasos para integrar la IA</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">{s.icon}</div>
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
          <div className="section-label">Funcionalidades</div>
          <h2 className="section-title">Todo lo que necesitas</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Snippet preview ── */}
      <section className="section embed-section">
        <div className="section-inner embed-inner">
          <div className="embed-copy">
            <div className="section-label">Integración</div>
            <h2 className="section-title">Dos líneas de código</h2>
            <p className="embed-desc">
              Pega este snippet en tu tienda. Funciona con cualquier plataforma
              de e-commerce o HTML estático.
            </p>
            <Link to="/login" className="btn-nav-primary">Obtener mi API key →</Link>
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
          <div className="section-label">Precios</div>
          <h2 className="section-title">Simple y transparente</h2>
          <div className="pricing-grid">
            {PLANS.map((p) => (
              <div key={p.name} className={`plan-card${p.highlight ? ' plan-card--highlight' : ''}`}>
                {p.highlight && <div className="plan-badge">Más popular</div>}
                <h3 className="plan-name">{p.name}</h3>
                <div className="plan-price">
                  {p.price}<span className="plan-period">{p.period}</span>
                </div>
                <p className="plan-limit">{p.limit}</p>
                <ul className="plan-features">
                  {p.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                <Link to="/login" className={`plan-cta${p.highlight ? ' plan-cta--primary' : ''}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-brand">
          <div className="brand-logo sm"><span className="brand-logo-letter">U</span></div>
          <span>USize</span>
        </div>
        <p className="footer-copy">© 2024 USize · Construido con React &amp; TensorFlow.js</p>
        <div className="footer-links">
          <a href="#como-funciona">Documentación</a>
          <a href="#precios">Precios</a>
          <Link to="/login">Acceso</Link>
        </div>
      </footer>

      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </div>
  );
}
