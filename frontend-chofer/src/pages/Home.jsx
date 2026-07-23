import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useBitacora } from '../context/BitacoraContext';

const opcionesNivel = ['Full', 'Media', 'Baja'];

export default function Home() {
  const { bitacora, cargando, refrescar } = useBitacora();
  const [vehiculos, setVehiculos] = useState([]);
  const [form, setForm] = useState({ idVehiculo: '', odometroInicial: '', varillaAntes: 'Full', liquidoFrenos: 'Full', liquidoDireccion: 'Full' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bitacora) {
      api.get('/vehiculos').then(({ data }) => setVehiculos(data)).catch(() => {});
    }
  }, [bitacora]);

  async function enviarChecklist(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await api.post('/bitacoras', { ...form, odometroInicial: Number(form.odometroInicial) });
      refrescar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el checklist');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 40 }}>Cargando...</p>;

  // Sin bitacora abierta hoy -> checklist matutino
  if (!bitacora) {
    return (
      <div>
        <h1 style={{ marginBottom: 4 }}>Checklist matutino</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Revisa tu unidad antes de salir. Un Admin debe aprobarlo para que puedas vender.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={enviarChecklist}>
          <div className="field">
            <label>Vehiculo asignado</label>
            <select required value={form.idVehiculo} onChange={(e) => setForm({ ...form, idVehiculo: e.target.value })}>
              <option value="">Selecciona...</option>
              {vehiculos.map((v) => (
                <option key={v.idVehiculo} value={v.idVehiculo}>{v.idVehiculo} — {v.descripcion}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Odometro inicial (km)</label>
            <input required type="number" inputMode="numeric" value={form.odometroInicial} onChange={(e) => setForm({ ...form, odometroInicial: e.target.value })} />
          </div>
          <div className="field">
            <label>Varilla de aceite</label>
            <select value={form.varillaAntes} onChange={(e) => setForm({ ...form, varillaAntes: e.target.value })}>
              {opcionesNivel.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Liquido de frenos</label>
            <select value={form.liquidoFrenos} onChange={(e) => setForm({ ...form, liquidoFrenos: e.target.value })}>
              {opcionesNivel.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Liquido de direccion</label>
            <select value={form.liquidoDireccion} onChange={(e) => setForm({ ...form, liquidoDireccion: e.target.value })}>
              {opcionesNivel.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>
          <button className="btn btn-brand" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar checklist'}</button>
        </form>
      </div>
    );
  }

  // Esperando VoBo del Admin
  if (bitacora.estado === 'PendienteVoBo') {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Esperando aprobación</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Tu checklist para <strong>{bitacora.idVehiculo}</strong> ya se envió. Un Admin debe darte el visto bueno antes de que puedas vender.
        </p>
        <button className="btn btn-ghost" onClick={refrescar}>Actualizar estado</button>
      </div>
    );
  }

  // En operacion
  return (
    <div>
      <div className="card">
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Hoy estas en</p>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{bitacora.idVehiculo}</h1>
        <span className="pill pill-ok">En operacion</span>
      </div>

      <Link to="/vender" className="btn btn-brand" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
        🧊 Nueva venta
      </Link>
      <Link to="/traspaso" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
        🔁 Traspaso / devolucion
      </Link>
      <Link to="/gastos" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
        💵 Gasolina / gastos
      </Link>
    </div>
  );
}
