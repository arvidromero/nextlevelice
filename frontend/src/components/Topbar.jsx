import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Brand from './Brand';
import { useAuth } from '../context/AuthContext';

const grupos = [
  {
    titulo: null,
    items: [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/mapa', label: 'Mapa' },
    ],
  },
  {
    titulo: 'Catálogos',
    items: [
      { to: '/productos', label: 'Productos' },
      { to: '/clientes', label: 'Clientes' },
      { to: '/vehiculos', label: 'Vehículos' },
      { to: '/ubicaciones', label: 'Ubicaciones' },
    ],
  },
  {
    titulo: 'Operación',
    items: [
      { to: '/ventas', label: 'Ventas' },
      { to: '/inventario', label: 'Inventario' },
      { to: '/movimientos', label: 'Movimientos' },
      { to: '/bitacoras', label: 'Bitácoras' },
      { to: '/visitas', label: 'Visitas' },
    ],
  },
  {
    titulo: 'Administración',
    items: [{ to: '/usuarios', label: 'Usuarios' }],
  },
];

export default function Topbar() {
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);

  function cerrarEnMobile() {
    setAbierto(false);
  }

  return (
    <>
      {/* Barra superior solo visible en celular */}
      <div className="mobile-topbar">
        <button className="hamburguesa" onClick={() => setAbierto(true)} aria-label="Abrir menú">
          <span /><span /><span />
        </button>
        <Brand size={22} />
        <div style={{ width: 32 }} />
      </div>

      {abierto && <div className="sidebar-backdrop" onClick={cerrarEnMobile} />}

      <aside className={`sidebar ${abierto ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand size={26} />
        </div>

        <nav className="sidebar-nav">
          {grupos.map((grupo, i) => (
            <div className="sidebar-grupo" key={i}>
              {grupo.titulo && <div className="sidebar-grupo-titulo">{grupo.titulo}</div>}
              {grupo.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={cerrarEnMobile}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-usuario">
          <span>{usuario?.nombre}</span>
          <button className="btn btn-ghost" onClick={logout}>Salir</button>
        </div>
      </aside>
    </>
  );
}
