import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BitacoraProvider, useBitacora } from './context/BitacoraContext';
import { useUbicacionPing } from './hooks/useUbicacionPing';
import TopbarChofer from './components/TopbarChofer';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Home from './pages/Home';
import Vender from './pages/Vender';
import Traspaso from './pages/Traspaso';
import Gastos from './pages/Gastos';
import Cierre from './pages/Cierre';

function Shell({ children }) {
  const { usuario } = useAuth();
  const { bitacora, refrescar } = useBitacora();

  useEffect(() => { if (usuario) refrescar(); }, [usuario]);
  useUbicacionPing(bitacora);

  if (!usuario) return <Navigate to="/login" replace />;

  const enOperacion = bitacora?.estado === 'EnOperacion';

  return (
    <div className="app-shell">
      <TopbarChofer />
      <div className="contenido">{children}</div>
      {enOperacion && <BottomNav />}
    </div>
  );
}

function RutaProtegida({ children, requiereOperacion }) {
  const { usuario } = useAuth();
  const { bitacora, cargando } = useBitacora();

  if (!usuario) return <Navigate to="/login" replace />;
  if (requiereOperacion && !cargando && bitacora?.estado !== 'EnOperacion') return <Navigate to="/" replace />;

  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <AuthProvider>
      <BitacoraProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RutaProtegida><Home /></RutaProtegida>} />
            <Route path="/vender" element={<RutaProtegida requiereOperacion><Vender /></RutaProtegida>} />
            <Route path="/traspaso" element={<RutaProtegida requiereOperacion><Traspaso /></RutaProtegida>} />
            <Route path="/gastos" element={<RutaProtegida requiereOperacion><Gastos /></RutaProtegida>} />
            <Route path="/cierre" element={<RutaProtegida requiereOperacion><Cierre /></RutaProtegida>} />
          </Routes>
        </BrowserRouter>
      </BitacoraProvider>
    </AuthProvider>
  );
}
