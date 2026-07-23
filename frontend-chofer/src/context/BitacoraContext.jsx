import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const BitacoraContext = createContext(null);

export function BitacoraProvider({ children }) {
  const [bitacora, setBitacora] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/bitacoras/activa');
      setBitacora(data);
    } catch (err) {
      setBitacora(null); // 404 = no tiene bitacora abierta, es un estado valido
    } finally {
      setCargando(false);
    }
  }, []);

  return (
    <BitacoraContext.Provider value={{ bitacora, cargando, refrescar }}>
      {children}
    </BitacoraContext.Provider>
  );
}

export function useBitacora() {
  return useContext(BitacoraContext);
}
