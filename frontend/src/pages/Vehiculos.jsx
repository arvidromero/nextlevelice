import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

const vacio = { idVehiculo: '', placa: '', descripcion: '' };

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get('/vehiculos');
      setVehiculos(data);
    } catch (err) {
      setError('No se pudieron cargar los vehiculos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/vehiculos', form);
      setModalAbierto(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el vehiculo');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(idVehiculo) {
    if (!confirm(`¿Desactivar el vehiculo ${idVehiculo}?`)) return;
    await api.delete(`/vehiculos/${idVehiculo}`);
    cargar();
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Vehiculos</h1>
            <p>Camionetas que funcionan como almacen movil</p>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => { setForm(vacio); setModalAbierto(true); }}>+ Nuevo vehiculo</button>
        </div>

        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : vehiculos.length === 0 ? (
            <div className="empty-state">Aun no hay vehiculos registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Placa</th>
                  <th>Descripcion</th>
                  <th>Odometro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v) => (
                  <tr key={v.idVehiculo}>
                    <td>{v.idVehiculo}</td>
                    <td>{v.placa || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{v.descripcion}</td>
                    <td>{v.odometroActual.toLocaleString()} km</td>
                    <td>
                      <button className="btn btn-danger" onClick={() => desactivar(v.idVehiculo)}>Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 18 }}>Nuevo vehiculo</h2>
            <form onSubmit={guardar}>
              <div className="field">
                <label>ID (ej. VH006)</label>
                <input required value={form.idVehiculo} onChange={(e) => setForm({ ...form, idVehiculo: e.target.value })} />
              </div>
              <div className="field">
                <label>Placa</label>
                <input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
              </div>
              <div className="field">
                <label>Descripcion</label>
                <input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
