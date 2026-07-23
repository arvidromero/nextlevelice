import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

export default function Inventario() {
  const [existencias, setExistencias] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    try {
      const [existenciasRes, ubicacionesRes, productosRes] = await Promise.all([
        api.get('/inventario/existencias', { params: filtroUbicacion ? { idUbicacion: filtroUbicacion } : {} }),
        api.get('/ubicaciones'),
        api.get('/productos'),
      ]);
      setExistencias(existenciasRes.data);
      setUbicaciones(ubicacionesRes.data);
      setProductos(productosRes.data);
    } catch (err) {
      setError('No se pudieron cargar las existencias');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [filtroUbicacion]);

  function nombreUbicacion(id) {
    const u = ubicaciones.find((x) => x.idUbicacion === id);
    return u ? u.nombre : id;
  }

  function nombreProducto(id) {
    const p = productos.find((x) => x.idProducto === id);
    return p ? p.descripcion : id;
  }

  // Agrupamos por ubicacion para que se lea como un almacen a la vez
  const porUbicacion = existencias.reduce((acc, e) => {
    (acc[e.idUbicacion] = acc[e.idUbicacion] || []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Inventario</h1>
            <p>Existencias actuales por camara y camioneta</p>
          </div>
        </div>

        <div className="toolbar" style={{ justifyContent: 'flex-start' }}>
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            style={{ padding: '10px 13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, minWidth: 220 }}
          >
            <option value="">Todas las ubicaciones</option>
            {ubicaciones.map((u) => (
              <option key={u.idUbicacion} value={u.idUbicacion}>{u.idUbicacion} — {u.nombre}</option>
            ))}
          </select>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {cargando ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
        ) : Object.keys(porUbicacion).length === 0 ? (
          <div className="card"><div className="empty-state">No hay existencias registradas para este filtro.</div></div>
        ) : (
          Object.entries(porUbicacion).map(([idUbicacion, items]) => (
            <div className="card" key={idUbicacion} style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, marginBottom: 12 }}>
                {idUbicacion} — {nombreUbicacion(idUbicacion)}
              </h2>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Saldo</th>
                    <th>Ultima actualizacion</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={`${e.idUbicacion}-${e.idProducto}`}>
                      <td style={{ fontFamily: 'var(--font-body)' }}>{nombreProducto(e.idProducto)}</td>
                      <td style={{ fontWeight: 700 }}>{e.saldo}</td>
                      <td>{new Date(e.fechaActualizacion).toLocaleString('es-MX')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
