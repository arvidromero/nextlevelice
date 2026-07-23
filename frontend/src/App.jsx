import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Vehiculos from './pages/Vehiculos';
import Ubicaciones from './pages/Ubicaciones';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/vehiculos" element={<ProtectedRoute><Vehiculos /></ProtectedRoute>} />
          <Route path="/ubicaciones" element={<ProtectedRoute><Ubicaciones /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
