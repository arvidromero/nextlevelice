import { NavLink } from 'react-router-dom';
import Brand from './Brand';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { usuario, logout } = useAuth();
  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Brand size={26} />
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/mapa">Mapa</NavLink>
          <NavLink to="/productos">Productos</NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/vehiculos">Vehiculos</NavLink>
          <NavLink to="/ubicaciones">Ubicaciones</NavLink>
          <NavLink to="/ventas">Ventas</NavLink>
          <NavLink to="/inventario">Inventario</NavLink>
          <NavLink to="/movimientos">Movimientos</NavLink>
          <NavLink to="/bitacoras">Bitácoras</NavLink>
          <NavLink to="/usuarios">Usuarios</NavLink>
        </nav>
      </div>
      <div className="topbar-user">
        <span>{usuario?.nombre}</span>
        <button className="btn btn-ghost" onClick={logout}>Salir</button>
      </div>
    </div>
  );
}
