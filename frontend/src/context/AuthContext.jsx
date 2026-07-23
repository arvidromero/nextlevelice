import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('nlice_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login-admin', { email, password });
    localStorage.setItem('nlice_token', data.token);
    localStorage.setItem('nlice_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem('nlice_token');
    localStorage.removeItem('nlice_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
