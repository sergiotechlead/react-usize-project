import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const API = '/api/v1';

function getTokens() {
  try {
    return JSON.parse(sessionStorage.getItem('usize_tokens') || 'null');
  } catch { return null; }
}

function saveTokens(tokens) {
  sessionStorage.setItem('usize_tokens', JSON.stringify(tokens));
}

function clearTokens() {
  sessionStorage.removeItem('usize_tokens');
  sessionStorage.removeItem('usize_user');
}

export async function apiFetch(path, options = {}) {
  const tokens = getTokens();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401 && tokens?.refresh_token) {
    const refreshRes = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json();
      saveTokens({ ...tokens, access_token });
      const retryHeaders = { ...headers, Authorization: `Bearer ${access_token}` };
      return fetch(`${API}${path}`, { ...options, headers: retryHeaders });
    }
    clearTokens();
    window.location.hash = '#/login';
  }

  return res;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('usize_user')); } catch { return null; }
  });

  async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Credenciales inválidas');
    }
    const data = await res.json();
    saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
    const profile = {
      ...data.user,
      plan: data.user.plan || 'Starter',
      brand: data.user.brand_name || data.user.name,
      apiKey: null,
    };
    sessionStorage.setItem('usize_user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  }

  async function register(name, email, password, brand_name, plan) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, brand_name, plan }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al registrarse');
    }
    const data = await res.json();
    saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
    const profile = {
      ...data.user,
      plan: plan || 'Starter',
      brand: brand_name || name,
      apiKey: null,
    };
    sessionStorage.setItem('usize_user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  }

  async function logout() {
    const tokens = getTokens();
    if (tokens?.access_token) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }

  function refreshUser(updates) {
    const updated = { ...user, ...updates };
    sessionStorage.setItem('usize_user', JSON.stringify(updated));
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
