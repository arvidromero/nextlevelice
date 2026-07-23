import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <div className="bottom-nav">
      <NavLink to="/" end><span className="icono">🏠</span>Inicio</NavLink>
      <NavLink to="/vender"><span className="icono">🧊</span>Vender</NavLink>
      <NavLink to="/traspaso"><span className="icono">🔁</span>Traspaso</NavLink>
      <NavLink to="/gastos"><span className="icono">💵</span>Gastos</NavLink>
      <NavLink to="/cierre"><span className="icono">🌙</span>Cierre</NavLink>
    </div>
  );
}
