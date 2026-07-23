import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

const vacio = { idProducto: '', descripcion: '', precioVenta: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get('/productos');
      setProductos(data);
    } catch (err) {
      setError('No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setForm(vacio);
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/productos', { ...form, precioVenta: Number(form.precioVenta) });
      setModalAbierto(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el producto');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(idProducto) {
    if (!confirm(`¿Desactivar el producto ${idProducto}? Ya no aparecera en catalogos activos.`)) return;
    await api.delete(`/productos/${idProducto}`);
    cargar();
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Productos</h1>
            <p>Catalogo de hielos que se venden en ruta</p>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo producto</button>
        </div>

        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : productos.length === 0 ? (
            <div className="empty-state">Aun no hay productos. Crea el primero.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descripcion</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.idProducto}>
                    <td>{p.idProducto}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{p.descripcion}</td>
                    <td>${Number(p.precioVenta).toFixed(2)}</td>
                    <td><span className="pill pill-ok">Activo</span></td>
                    <td>
                      <button className="btn btn-danger" onClick={() => desactivar(p.idProducto)}>Desactivar</button>
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
            <h2 style={{ marginBottom: 18 }}>Nuevo producto</h2>
            <form onSubmit={guardar}>
              <div className="field">
                <label>ID (ej. NLC5K)</label>
                <input required value={form.idProducto} onChange={(e) => setForm({ ...form, idProducto: e.target.value })} />
              </div>
              <div className="field">
                <label>Descripcion</label>
                <input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="field">
                <label>Precio de venta</label>
                <input required type="number" step="0.01" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} />
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
