import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCircleCheck, faCircleXmark, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useAuth, apiFetch } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './AcceptInvitePage.css';

const INVITE_TOKEN_KEY = 'usize_invite_token';

export default function AcceptInvitePage() {
  const { t } = useTranslation('team');
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus]   = useState(token ? 'loading' : 'no-token');
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    if (!user) {
      sessionStorage.setItem(INVITE_TOKEN_KEY, token);
      setStatus('need-auth');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    apiFetch('/organizations/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async r => {
        if (cancelled) return;
        if (r.ok) {
          sessionStorage.removeItem(INVITE_TOKEN_KEY);
          setStatus('success');
        } else {
          const body = await r.json().catch(() => ({}));
          setError(body.message || '');
          setStatus('error');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, [token, user]);

  return (
    <div className="accept-invite-page">
      <Navbar />

      <div className="accept-invite-layout">
        <div className="accept-invite-card">
          {status === 'loading' && (
            <div className="ai-state">
              <FontAwesomeIcon icon={faSpinner} spin className="ai-state-icon" />
              <p>{t('acceptInvite.loading')}</p>
            </div>
          )}

          {status === 'no-token' && (
            <div className="ai-state">
              <FontAwesomeIcon icon={faCircleXmark} className="ai-state-icon error" />
              <p>{t('acceptInvite.invalidLink')}</p>
            </div>
          )}

          {status === 'need-auth' && (
            <div className="ai-state">
              <FontAwesomeIcon icon={faUserPlus} className="ai-state-icon" />
              <h2>{t('acceptInvite.needAuthTitle')}</h2>
              <p>{t('acceptInvite.needAuthDesc')}</p>
              <div className="ai-actions">
                <Link to="/login" className="ai-btn-primary">{t('acceptInvite.signIn')}</Link>
                <Link to="/register" className="ai-btn-outline">{t('acceptInvite.createAccount')}</Link>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="ai-state">
              <FontAwesomeIcon icon={faCircleCheck} className="ai-state-icon success" />
              <h2>{t('acceptInvite.successTitle')}</h2>
              <p>{t('acceptInvite.successDesc')}</p>
              <div className="ai-actions">
                <Link to="/dashboard" className="ai-btn-primary">{t('acceptInvite.goToDashboard')}</Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="ai-state">
              <FontAwesomeIcon icon={faCircleXmark} className="ai-state-icon error" />
              <p>{error || t('acceptInvite.genericError')}</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
