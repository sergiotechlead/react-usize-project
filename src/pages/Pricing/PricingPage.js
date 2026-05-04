import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faXmark, faRocket, faGem, faBuilding,
  faChevronDown, faChevronUp, faStar,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './PricingPage.css';

const PLAN_ICONS = [faRocket, faGem, faBuilding];
const PLAN_IDS   = ['starter', 'pro', 'enterprise'];

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
  if (value === true)  return <FontAwesomeIcon icon={faCheck} className="cmp-yes" />;
  if (value === false) return <FontAwesomeIcon icon={faXmark}  className="cmp-no" />;
  return <span className="cmp-text">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { t } = useTranslation('pricing');

  const PLANS      = t('plans',            { returnObjects: true });
  const COMPARISON = t('comparison.rows',  { returnObjects: true });
  const FAQS       = t('faq.items',        { returnObjects: true });

  return (
    <div className="pricing-page">
      <Navbar activePage="pricing" />

      {/* ── Header ── */}
      <section className="pricing-hero">
        <div className="section-label">{t('hero.label')}</div>
        <h1 className="pricing-hero-title">{t('hero.title')}</h1>
        <p className="pricing-hero-desc">{t('hero.desc')}</p>

        <div className="billing-toggle">
          <span className={!annual ? 'active' : ''}>{t('hero.monthly')}</span>
          <button
            className={`toggle-switch${annual ? ' on' : ''}`}
            onClick={() => setAnnual(v => !v)}
            role="switch"
            aria-checked={annual}
          >
            <span className="toggle-thumb" />
          </button>
          <span className={annual ? 'active' : ''}>
            {t('hero.annual')}
            <span className="billing-badge">{t('hero.annualBadge')}</span>
          </span>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="pricing-cards-section">
        <div className="section-inner">
          <div className="pricing-grid">
            {PLANS.map((p, i) => (
              <div key={PLAN_IDS[i]} className={`plan-card${i === 1 ? ' plan-card--highlight' : ''}`}>
                {p.badge && (
                  <div className="plan-badge">
                    <FontAwesomeIcon icon={faStar} /> {p.badge}
                  </div>
                )}
                <div className="plan-icon-wrap">
                  <FontAwesomeIcon icon={PLAN_ICONS[i]} />
                </div>
                <h3 className="plan-name">{p.name}</h3>
                <p className="plan-desc">{p.desc}</p>
                <div className="plan-price-wrap">
                  {i === 2 ? (
                    <span className="plan-price-custom">{t('priceCustom')}</span>
                  ) : i === 0 ? (
                    <span className="plan-price-value">{t('priceFree')}</span>
                  ) : (
                    <>
                      <span className="plan-price-value">
                        {annual ? '$23' : '$29'}
                      </span>
                      <span className="plan-price-period">{t('perMonth')}</span>
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
                  to={i === 2 ? '/contact' : '/register'}
                  className={`plan-cta-btn${i === 1 ? ' primary' : ''}`}
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
          <div className="section-label">{t('comparison.label')}</div>
          <h2 className="section-title">{t('comparison.title')}</h2>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>{t('comparison.colFeature')}</th>
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
          <div className="section-label">{t('faq.label')}</div>
          <h2 className="section-title">{t('faq.title')}</h2>
          <div className="faq-list">
            {FAQS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section cta-banner-section">
        <div className="cta-banner">
          <h2 className="cta-banner-title">{t('cta.title')}</h2>
          <p className="cta-banner-desc">{t('cta.desc')}</p>
          <div className="cta-banner-actions">
            <Link to="/register" className="btn-cta-primary">{t('cta.primary')}</Link>
            <Link to="/docs" className="btn-cta-secondary">{t('cta.secondary')}</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
