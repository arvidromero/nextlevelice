import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('nlice_chofer_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(email, pin) {
    const { data } = await api.post('/auth/login-chofer', { email, pin });
    localStorage.setItem('nlice_chofer_token', data.token);
    localStorage.setItem('nlice_chofer_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem('nlice_chofer_token');
    localStorage.removeItem('nlice_chofer_usuario');
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
