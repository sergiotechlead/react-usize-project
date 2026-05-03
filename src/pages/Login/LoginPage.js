import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (user) { navigate('/dashboard', { replace: true }); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // simulated network delay
      login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Link to="/" className="login-back">← Volver al inicio</Link>

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo">
            <span className="brand-logo-letter">U</span>
          </div>
          <span className="login-brand-name">USize</span>
        </div>

        <h1 className="login-title">Bienvenido de nuevo</h1>
        <p className="login-subtitle">Accede a tu dashboard para gestionar tu modelo de tallas.</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="marca@empresa.com"
              required
              autoFocus
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={3}
              required
            />
          </div>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? <><span className="loading-spinner" />Entrando...</> : 'Iniciar sesión →'}
          </button>
        </form>

        <div className="login-hint">
          <p>
            <strong>Demo:</strong> usa <code>demo@usize.app</code> con cualquier contraseña,
            o cualquier email válido para crear una cuenta de prueba.
          </p>
        </div>
      </div>
    </div>
  );
}
