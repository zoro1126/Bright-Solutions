import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ROUTES } from '../routes';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bright_user');
      return stored ? JSON.parse(stored) : {
        id: 2,
        username: 'dr_kulkarni',
        full_name: 'Dr. Vikram Kulkarni, MD',
        role: 'DOCTOR',
        email: 'vikram@brightsolutions.com',
      };
    } catch {
      return null;
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('bright_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bright_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bright_theme', 'light');
    }
  }, [darkMode]);

  const loginUser = async (username, password) => {
    const res = await api.login(username, password);
    setUser(res.user);
    return res;
  };

  const switchRole = (newRole) => {
    const rolePersonas = {
      RECEPTIONIST: { id: 1, username: 'receptionist_anita', full_name: 'Anita Sharma', role: 'RECEPTIONIST' },
      DOCTOR: { id: 2, username: 'dr_kulkarni', full_name: 'Dr. Vikram Kulkarni, MD', role: 'DOCTOR' },
      CASHIER: { id: 5, username: 'cashier_rahul', full_name: 'Rahul Verma', role: 'CASHIER' },
      ADMIN: { id: 6, username: 'admin', full_name: 'Dr. Suresh Deshmukh', role: 'ADMIN' },
    };
    const targetUser = rolePersonas[newRole] || rolePersonas.RECEPTIONIST;
    setUser(targetUser);
    localStorage.setItem('bright_user', JSON.stringify(targetUser));
  };

  const logout = () => {
    localStorage.removeItem('bright_token');
    localStorage.removeItem('bright_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'RECEPTIONIST',
        loginUser,
        switchRole,
        logout,
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
