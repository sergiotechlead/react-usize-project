import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faSpinner, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Link to="/" className="login-back">
        <FontAwesomeIcon icon={faArrowLeft} /> {t('backHome')}
      </Link>

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo">
            <span className="brand-logo-letter">U</span>
          </div>
          <span className="login-brand-name">USize</span>
        </div>

        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">{t('login.email')}</label>
            <div className="field-icon-wrap">
              <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
              <input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marca@empresa.com" required autoFocus
              />
            </div>
          </div>
          <div className="login-field">
            <label htmlFor="password">{t('login.password')}</label>
            <div className="field-icon-wrap">
              <FontAwesomeIcon icon={faLock} className="field-icon" />
              <input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={3} required
              />
            </div>
          </div>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> {t('login.submitting')}</>
            ) : (
              <>{t('login.submit')} <FontAwesomeIcon icon={faArrowRight} /></>
            )}
          </button>
        </form>

        <p className="login-switch">
          {t('login.noAccount')} <Link to="/register">{t('login.createAccount')}</Link>
        </p>

        <div className="login-hint">
          <p><strong>Demo:</strong> {t('login.demoHint')}</p>
        </div>
      </div>
    </div>
  );
}
