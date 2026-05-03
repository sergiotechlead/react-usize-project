import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Mock SaaS users — any of these email/password pairs work, or use guest/guest
const MOCK_USERS = {
  'demo@usize.app': { name: 'Demo Store', plan: 'Pro', brand: 'Demo Brand', apiKey: 'us_live_d3m0k3y789' },
  'admin@usize.app': { name: 'Admin User',  plan: 'Enterprise', brand: 'USize HQ', apiKey: 'us_live_adm1nk3y0' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('usize_user')); } catch { return null; }
  });

  function login(email, password) {
    if (!email || password.length < 3) throw new Error('Credenciales inválidas');
    const profile = MOCK_USERS[email.toLowerCase()] ?? {
      name: email.split('@')[0],
      plan: 'Starter',
      brand: email.split('@')[0],
      apiKey: `us_live_${Math.random().toString(36).slice(2, 14)}`,
    };
    const mockUser = { email: email.toLowerCase(), ...profile };
    sessionStorage.setItem('usize_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  }

  function logout() {
    sessionStorage.removeItem('usize_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
