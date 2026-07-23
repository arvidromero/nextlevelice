import { useEffect, useState } from 'react';
import api, { subirImagen, urlImagen } from '../api/client';
import Topbar from '../components/Topbar';

const vacio = { idProducto: '', descripcion: '', precioVenta: '', imagenURL: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

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
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(producto) {
    setEditando(producto);
    setForm({ idProducto: producto.idProducto, descripcion: producto.descripcion, precioVenta: producto.precioVenta, imagenURL: producto.imagenURL || '' });
    setModalAbierto(true);
  }

  async function onSeleccionarImagen(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoImagen(true);
    try {
      const url = await subirImagen(file);
      setForm((f) => ({ ...f, imagenURL: url }));
    } catch (err) {
      alert('No se pudo subir la imagen');
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = { ...form, precioVenta: Number(form.precioVenta) };
      if (editando) {
        await api.put(`/productos/${editando.idProducto}`, payload);
      } else {
        await api.post('/productos', payload);
      }
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
                  <th></th>
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
                    <td>
                      {p.imagenURL ? (
                        <img src={urlImagen(p.imagenURL)} alt={p.descripcion} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F2F2F0' }} />
                      )}
                    </td>
                    <td>{p.idProducto}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{p.descripcion}</td>
                    <td>${Number(p.precioVenta).toFixed(2)}</td>
                    <td><span className="pill pill-ok">Activo</span></td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => abrirEditar(p)}>Editar</button>
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
            <h2 style={{ marginBottom: 18 }}>{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={guardar}>
              <div className="field">
                <label>ID (ej. NLC5K)</label>
                <input required disabled={!!editando} value={form.idProducto} onChange={(e) => setForm({ ...form, idProducto: e.target.value })} />
              </div>
              <div className="field">
                <label>Descripcion</label>
                <input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="field">
                <label>Precio de venta</label>
                <input required type="number" step="0.01" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} />
              </div>
              <div className="field">
                <label>Foto</label>
                {form.imagenURL && (
                  <img src={urlImagen(form.imagenURL)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }} />
                )}
                <input type="file" accept="image/*" onChange={onSeleccionarImagen} />
                {subiendoImagen && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Subiendo...</p>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={guardando || subiendoImagen}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
