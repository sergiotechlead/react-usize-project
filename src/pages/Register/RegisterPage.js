import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faArrowRight, faSpinner,
  faUser, faEnvelope, faLock, faStore,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import './RegisterPage.css';

const PLAN_OPTIONS = [
  { id: 'Starter', label: 'Starter', price: 'Gratis', desc: '500 predicciones/mes' },
  { id: 'Pro',     label: 'Pro',     price: '$29/mes', desc: '10 000 predicciones/mes' },
];

export default function RegisterPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

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
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (!terms) { setError('Debes aceptar los términos de servicio.'); return; }
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
        <FontAwesomeIcon icon={faArrowLeft} /> Volver al inicio
      </Link>

      <div className="reg-card">
        <div className="reg-brand">
          <div className="brand-logo">
            <span className="brand-logo-letter">U</span>
          </div>
          <span className="reg-brand-name">USize</span>
        </div>

        <h1 className="reg-title">Crea tu cuenta</h1>
        <p className="reg-subtitle">Empieza gratis. Sin tarjeta de crédito requerida.</p>

        {error && <div className="reg-error" role="alert">{error}</div>}

        <form className="reg-form" onSubmit={handleSubmit}>
          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="reg-name">Nombre completo</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faUser} className="field-icon" />
                <input
                  id="reg-name" type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre" required autoFocus
                />
              </div>
            </div>
            <div className="reg-field">
              <label htmlFor="reg-brand">Nombre de la tienda</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faStore} className="field-icon" />
                <input
                  id="reg-brand" type="text" value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Mi Marca" required
                />
              </div>
            </div>
          </div>

          <div className="reg-field">
            <label htmlFor="reg-email">Email</label>
            <div className="field-icon-wrap">
              <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
              <input
                id="reg-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marca@empresa.com" required
              />
            </div>
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label htmlFor="reg-password">Contraseña</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="reg-password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" minLength={6} required
                />
              </div>
            </div>
            <div className="reg-field">
              <label htmlFor="reg-confirm">Confirmar contraseña</label>
              <div className="field-icon-wrap">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="reg-confirm" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" minLength={6} required
                />
              </div>
            </div>
          </div>

          <div className="reg-field">
            <label>Plan inicial</label>
            <div className="plan-selector">
              {PLAN_OPTIONS.map(p => (
                <label
                  key={p.id}
                  className={`plan-option${plan === p.id ? ' selected' : ''}`}
                >
                  <input
                    type="radio" name="plan" value={p.id}
                    checked={plan === p.id}
                    onChange={() => setPlan(p.id)}
                  />
                  <div className="plan-option-body">
                    <div className="plan-option-top">
                      <span className="plan-option-name">{p.label}</span>
                      <span className="plan-option-price">{p.price}</span>
                    </div>
                    <span className="plan-option-desc">{p.desc}</span>
                  </div>
                  {plan === p.id && (
                    <FontAwesomeIcon icon={faCheck} className="plan-option-check" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <label className="terms-label">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
            Acepto los <Link to="/docs">términos de servicio</Link> y la política de privacidad
          </label>

          <button type="submit" className="reg-submit" disabled={loading}>
            {loading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Creando cuenta...</>
            ) : (
              <>Crear cuenta <FontAwesomeIcon icon={faArrowRight} /></>
            )}
          </button>
        </form>

        <p className="reg-switch">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
