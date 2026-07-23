import { useAuth } from '../context/AuthContext';

export default function TopbarChofer() {
  const { usuario, logout } = useAuth();
  return (
    <div className="topbar-chofer">
      <img src="/logo.svg" alt="NextLevel Ice" />
      <button className="salir" onClick={logout}>{usuario?.nombre} · Salir</button>
    </div>
  );
}
