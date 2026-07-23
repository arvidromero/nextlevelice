import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Vehiculos from './pages/Vehiculos';
import Ubicaciones from './pages/Ubicaciones';
import Ventas from './pages/Ventas';
import Inventario from './pages/Inventario';
import ClienteDetalle from './pages/ClienteDetalle';
import Movimientos from './pages/Movimientos';
import Bitacoras from './pages/Bitacoras';
import Usuarios from './pages/Usuarios';
import Dashboard from './pages/Dashboard';
import Mapa from './pages/Mapa';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/mapa" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/vehiculos" element={<ProtectedRoute><Vehiculos /></ProtectedRoute>} />
          <Route path="/ubicaciones" element={<ProtectedRoute><Ubicaciones /></ProtectedRoute>} />
          <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
          <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDetalle /></ProtectedRoute>} />
          <Route path="/movimientos" element={<ProtectedRoute><Movimientos /></ProtectedRoute>} />
          <Route path="/bitacoras" element={<ProtectedRoute><Bitacoras /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
