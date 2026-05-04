import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faXmark, faRocket, faGem, faBuilding,
  faChevronDown, faChevronUp, faStar,
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './PricingPage.css';

const PLANS = [
  {
    id: 'starter',
    icon: faRocket,
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    limit: '500 predicciones/mes',
    desc: 'Ideal para tiendas pequeñas que quieren probar la tecnología.',
    cta: 'Empezar gratis',
    highlight: false,
    features: [
      '1 modelo de tallas',
      'Widget estándar',
      'Predicciones básicas (S/M/L/XL)',
      'Dashboard de analytics',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    icon: faGem,
    name: 'Pro',
    monthlyPrice: 29,
    annualPrice: 23,
    limit: '10 000 predicciones/mes',
    desc: 'Para marcas en crecimiento que necesitan más potencia y personalización.',
    cta: 'Probar Pro',
    highlight: true,
    badge: 'Más popular',
    features: [
      '3 modelos de tallas',
      'Widget personalizado (colores, texto)',
      'Predicciones avanzadas',
      'Analytics con exportación CSV',
      'Soporte prioritario',
      'Webhook de eventos',
    ],
  },
  {
    id: 'enterprise',
    icon: faBuilding,
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    limit: 'Predicciones ilimitadas',
    desc: 'Para grandes marcas y plataformas con requisitos específicos.',
    cta: 'Contactar ventas',
    highlight: false,
    features: [
      'Modelos ilimitados',
      'Branding propio (white-label)',
      'SLA 99.9 %',
      'Manager de cuenta dedicado',
      'Integración personalizada',
      'Facturación corporativa',
    ],
  },
];

const COMPARISON = [
  { label: 'Predicciones/mes',   starter: '500',     pro: '10 000',    enterprise: 'Ilimitadas' },
  { label: 'Modelos de tallas',  starter: '1',       pro: '3',         enterprise: 'Ilimitados' },
  { label: 'Widget personalizado', starter: false,   pro: true,        enterprise: true },
  { label: 'Analytics avanzado',starter: false,      pro: true,        enterprise: true },
  { label: 'Exportación CSV',    starter: false,     pro: true,        enterprise: true },
  { label: 'Webhook de eventos', starter: false,     pro: true,        enterprise: true },
  { label: 'White-label',        starter: false,     pro: false,       enterprise: true },
  { label: 'SLA garantizado',    starter: false,     pro: false,       enterprise: true },
  { label: 'Manager dedicado',   starter: false,     pro: false,       enterprise: true },
  { label: 'Soporte',            starter: 'Email',   pro: 'Prioritario', enterprise: 'Dedicado' },
];

const FAQS = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Puedes actualizar o degradar tu plan desde el dashboard en cualquier momento. Los cambios aplican inmediatamente.',
  },
  {
    q: '¿Qué pasa si supero el límite de predicciones?',
    a: 'Las predicciones adicionales se cobran a $0.002 por predicción en los planes Starter y Pro. En Enterprise el límite es ilimitado.',
  },
  {
    q: '¿Hay un período de prueba para el plan Pro?',
    a: 'El plan Pro incluye 14 días de prueba gratuita. No se requiere tarjeta de crédito para empezar.',
  },
  {
    q: '¿Cómo funciona el entrenamiento del modelo en el navegador?',
    a: 'Usamos TensorFlow.js para entrenar la red neuronal directamente en el navegador del usuario. Los datos nunca salen del dispositivo.',
  },
  {
    q: '¿Puedo usar el widget en múltiples tiendas?',
    a: 'Cada tienda requiere su propia API key. En el plan Pro puedes tener hasta 3 modelos para 3 tiendas distintas.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="faq-icon" />
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

function ComparisonCell({ value }) {
  if (value === true)  return <FontAwesomeIcon icon={faCheck}  className="cmp-yes" />;
  if (value === false) return <FontAwesomeIcon icon={faXmark}  className="cmp-no" />;
  return <span className="cmp-text">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="pricing-page">
      <Navbar activePage="pricing" />

      {/* ── Header ── */}
      <section className="pricing-hero">
        <div className="section-label">Precios</div>
        <h1 className="pricing-hero-title">Simple y transparente</h1>
        <p className="pricing-hero-desc">
          Sin tarifas ocultas. Cancela en cualquier momento.
          Empieza gratis y escala cuando lo necesites.
        </p>

        <div className="billing-toggle">
          <span className={!annual ? 'active' : ''}>Mensual</span>
          <button
            className={`toggle-switch${annual ? ' on' : ''}`}
            onClick={() => setAnnual(v => !v)}
            role="switch"
            aria-checked={annual}
          >
            <span className="toggle-thumb" />
          </button>
          <span className={annual ? 'active' : ''}>
            Anual
            <span className="billing-badge">-20 %</span>
          </span>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="pricing-cards-section">
        <div className="section-inner">
          <div className="pricing-grid">
            {PLANS.map(p => (
              <div key={p.id} className={`plan-card${p.highlight ? ' plan-card--highlight' : ''}`}>
                {p.badge && (
                  <div className="plan-badge">
                    <FontAwesomeIcon icon={faStar} /> {p.badge}
                  </div>
                )}
                <div className="plan-icon-wrap">
                  <FontAwesomeIcon icon={p.icon} />
                </div>
                <h3 className="plan-name">{p.name}</h3>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price-wrap">
                  {p.monthlyPrice === null ? (
                    <span className="plan-price-custom">Custom</span>
                  ) : p.monthlyPrice === 0 ? (
                    <span className="plan-price-value">Gratis</span>
                  ) : (
                    <>
                      <span className="plan-price-value">
                        ${annual ? p.annualPrice : p.monthlyPrice}
                      </span>
                      <span className="plan-price-period">/mes</span>
                    </>
                  )}
                </div>
                <p className="plan-limit">{p.limit}</p>
                <ul className="plan-features-list">
                  {p.features.map(f => (
                    <li key={f}>
                      <FontAwesomeIcon icon={faCheck} className="plan-check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.id === 'enterprise' ? '/docs#contact' : '/register'}
                  className={`plan-cta-btn${p.highlight ? ' primary' : ''}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="section comparison-section">
        <div className="section-inner">
          <div className="section-label">Comparación</div>
          <h2 className="section-title">¿Qué incluye cada plan?</h2>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Funcionalidad</th>
                  <th>Starter</th>
                  <th className="col-highlight">Pro</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td><ComparisonCell value={row.starter} /></td>
                    <td className="col-highlight"><ComparisonCell value={row.pro} /></td>
                    <td><ComparisonCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section faq-section">
        <div className="section-inner faq-inner">
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Preguntas frecuentes</h2>
          <div className="faq-list">
            {FAQS.map((item, i) => <FaqItem key={i} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section cta-banner-section">
        <div className="cta-banner">
          <h2 className="cta-banner-title">Empieza hoy sin costo</h2>
          <p className="cta-banner-desc">
            Configura tu primer modelo en menos de 5 minutos. Sin tarjeta de crédito.
          </p>
          <div className="cta-banner-actions">
            <Link to="/register" className="btn-cta-primary">Crear cuenta gratis</Link>
            <Link to="/docs" className="btn-cta-secondary">Ver documentación</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
