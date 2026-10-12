import { createContext, useContext, useMemo, useState } from 'react';
import { STAFF } from './data/demo.js';

const KEY = 'elo-admin-auth-v1';
const DEMO_PASSWORD = 'elostats';

function readSession() {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const value = useMemo(() => ({
    session,
    login(email, password) {
      const staff = STAFF.find((row) => row.email.toLowerCase() === email.trim().toLowerCase());

      if (!staff) {
        return { ok: false, message: 'No staff account for that email.' };
      }

      if (staff.status !== 'Active') {
        return { ok: false, message: 'This account is not active.' };
      }

      if (password !== DEMO_PASSWORD) {
        return { ok: false, message: 'Wrong password.' };
      }

      const next = {
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role
      };

      localStorage.setItem(KEY, JSON.stringify(next));
      setSession(next);

      return { ok: true };
    },
    logout() {
      localStorage.removeItem(KEY);
      setSession(null);
    }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth needs AuthProvider');
  }

  return context;
}
