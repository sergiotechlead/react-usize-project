import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faArrowRight, faSpinner,
  faUser, faEnvelope, faLock, faStore, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import './RegisterPage.css';

export default function RegisterPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const PLAN_OPTIONS = [
    { id: 'Starter', label: 'Starter', price: t('register.plans.starter.price'), desc: t('register.plans.starter.desc') },
    { id: 'Pro',     label: 'Pro',     price: t('register.plans.pro.price'),     desc: t('register.plans.pro.desc') },
  ];

  const [name,     setName]     = useState('');
  const [brand,    setBrand]    = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [plan,     setPlan]     = useState('Starter');
  const [terms,    setTerms]    = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (user) { navigate('/dashboard', { replace: true }); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError(t('register.errors.passwordMismatch')); return; }
    if (!terms) { setError(t('register.errors.acceptTerms')); return; }
    setError('');
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <Link to="/" className="reg-back">
        <FontAwesomeIcon icon={faArrowLeft} /> {t('backHome')}
      </Link>

      <div className="reg-card">
        <div className="reg-brand">
          <div className="brand-logo">
            <span className="brand-logo-letter">U</span>
          </div>
          <span className="reg-brand-name">USize</span>
        </div>

        <h1 className="reg-title">{t('register.title')}</h1>
        <p className="reg-subtitle">{t('register.subtitle')}</p>

        {error && <div className="reg-error" role="alert">{error}</div>}

        <form className="reg-form" onSubmit={handleSubmit}>
          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="reg-name">{t('register.name')}</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faUser} className="field-icon" />
                <input
                  id="reg-name" type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('register.namePlaceholder')} required autoFocus
                />
              </div>
            </div>
            <div className="reg-field">
              <label htmlFor="reg-brand">{t('register.brand')}</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faStore} className="field-icon" />
                <input
                  id="reg-brand" type="text" value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder={t('register.brandPlaceholder')} required
                />
              </div>
            </div>
          </div>

          <div className="reg-field">
            <label htmlFor="reg-email">{t('register.email')}</label>
            <div className="field-icon-wrap">
              <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
              <input
                id="reg-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder')} required
              />
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="reg-password">{t('register.password')}</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="reg-password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('register.passwordPlaceholder')} minLength={6} required
                />
              </div>
            </div>
            <div className="reg-field">
              <label htmlFor="reg-confirm">{t('register.confirm')}</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="reg-confirm" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder={t('register.passwordPlaceholder')} minLength={6} required
                />
              </div>
            </div>
          </div>

          <div className="reg-field">
            <label>{t('register.initialPlan')}</label>
            <div className="plan-selector">
              {PLAN_OPTIONS.map(p => (
                <label key={p.id} className={`plan-option${plan === p.id ? ' selected' : ''}`}>
                  <input
                    type="radio" name="plan" value={p.id}
                    checked={plan === p.id} onChange={() => setPlan(p.id)}
                  />
                  <div className="plan-option-body">
                    <div className="plan-option-top">
                      <span className="plan-option-name">{p.label}</span>
                      <span className="plan-option-price">{p.price}</span>
                    </div>
                    <span className="plan-option-desc">{p.desc}</span>
                  </div>
                  {plan === p.id && <FontAwesomeIcon icon={faCheck} className="plan-option-check" />}
                </label>
              ))}
            </div>
          </div>

          <label className="terms-label">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
            {t('register.terms')} <Link to="/docs">{t('register.termsLink')}</Link> {t('register.termsAnd')}
          </label>

          <button type="submit" className="reg-submit" disabled={loading}>
            {loading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> {t('register.submitting')}</>
            ) : (
              <>{t('register.submit')} <FontAwesomeIcon icon={faArrowRight} /></>
            )}
          </button>
        </form>

        <p className="reg-switch">
          {t('register.hasAccount')} <Link to="/login">{t('register.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
