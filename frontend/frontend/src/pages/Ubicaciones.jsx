import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

const vacio = { idUbicacion: '', nombre: '', tipo: 'Camara', idVehiculo: '' };

export default function Ubicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [ubicacionesRes, vehiculosRes] = await Promise.all([
        api.get('/ubicaciones'),
        api.get('/vehiculos'),
      ]);
      setUbicaciones(ubicacionesRes.data);
      setVehiculos(vehiculosRes.data);
    } catch (err) {
      setError('No se pudieron cargar las ubicaciones');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(ubicacion) {
    setEditando(ubicacion);
    setForm({
      idUbicacion: ubicacion.idUbicacion,
      nombre: ubicacion.nombre,
      tipo: ubicacion.tipo,
      idVehiculo: ubicacion.idVehiculo || '',
    });
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = { ...form, idVehiculo: form.tipo === 'Vehiculo' ? form.idVehiculo : null };
      if (editando) {
        await api.put(`/ubicaciones/${editando.idUbicacion}`, payload);
      } else {
        await api.post('/ubicaciones', payload);
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar la ubicacion');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(idUbicacion) {
    if (!confirm(`¿Desactivar la ubicacion ${idUbicacion}?`)) return;
    await api.delete(`/ubicaciones/${idUbicacion}`);
    cargar();
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Ubicaciones</h1>
            <p>Camaras frias y camionetas -- ambas funcionan como almacen</p>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva ubicacion</button>
        </div>

        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : ubicaciones.length === 0 ? (
            <div className="empty-state">Aun no hay ubicaciones registradas.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Vehiculo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.map((u) => (
                  <tr key={u.idUbicacion}>
                    <td>{u.idUbicacion}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{u.nombre}</td>
                    <td>{u.tipo}</td>
                    <td>{u.idVehiculo || '—'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => abrirEditar(u)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => desactivar(u.idUbicacion)}>Desactivar</button>
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
            <h2 style={{ marginBottom: 18 }}>{editando ? 'Editar ubicacion' : 'Nueva ubicacion'}</h2>
            <form onSubmit={guardar}>
              <div className="field">
                <label>ID (ej. CAM004)</label>
                <input required disabled={!!editando} value={form.idUbicacion} onChange={(e) => setForm({ ...form, idUbicacion: e.target.value })} />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14 }}
                >
                  <option value="Camara">Camara</option>
                  <option value="Vehiculo">Vehiculo</option>
                </select>
              </div>
              {form.tipo === 'Vehiculo' && (
                <div className="field">
                  <label>Vehiculo asociado</label>
                  <select
                    required
                    value={form.idVehiculo}
                    onChange={(e) => setForm({ ...form, idVehiculo: e.target.value })}
                    style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14 }}
                  >
                    <option value="">Selecciona uno...</option>
                    {vehiculos.map((v) => (
                      <option key={v.idVehiculo} value={v.idVehiculo}>{v.idVehiculo} — {v.descripcion}</option>
                    ))}
                  </select>
                </div>
              )}
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
