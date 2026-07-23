import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

const lineaVacia = { idProducto: '', cantidad: 1 };

export default function Ventas() {
  const { usuario } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [existencias, setExistencias] = useState([]); // del vehiculo seleccionado
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [idCliente, setIdCliente] = useState('');
  const [idVehiculo, setIdVehiculo] = useState('');
  const [lineas, setLineas] = useState([{ ...lineaVacia }]);
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [ventasRes, clientesRes, vehiculosRes, productosRes] = await Promise.all([
        api.get('/ventas'),
        api.get('/clientes'),
        api.get('/vehiculos'),
        api.get('/productos'),
      ]);
      setVentas(ventasRes.data);
      setClientes(clientesRes.data);
      setVehiculos(vehiculosRes.data);
      setProductos(productosRes.data);
    } catch (err) {
      setError('No se pudo cargar la informacion');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarTodo(); }, []);

  // Cada vez que cambia el vehiculo, refrescamos que hay disponible en el
  useEffect(() => {
    if (!idVehiculo) { setExistencias([]); return; }
    api.get('/inventario/existencias', { params: { idUbicacion: idVehiculo } })
      .then(({ data }) => setExistencias(data))
      .catch(() => setExistencias([]));
  }, [idVehiculo]);

  function precioDe(idProducto) {
    const p = productos.find((x) => x.idProducto === idProducto);
    return p ? Number(p.precioVenta) : 0;
  }

  function saldoDe(idProducto) {
    const e = existencias.find((x) => x.idProducto === idProducto);
    return e ? e.saldo : 0;
  }

  function actualizarLinea(i, campo, valor) {
    setLineas((prev) => {
      const nuevas = [...prev];
      nuevas[i] = { ...nuevas[i], [campo]: valor };
      return nuevas;
    });
  }

  function actualizarProductoDeLinea(i, idProducto) {
    setLineas((prev) => {
      const nuevas = [...prev];
      nuevas[i] = { ...nuevas[i], idProducto, cantidad: 1 };
      return nuevas;
    });
  }

  function agregarLinea() {
    setLineas([...lineas, { ...lineaVacia }]);
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, idx) => idx !== i));
  }

  const subtotalEstimado = lineas.reduce((acc, l) => acc + precioDe(l.idProducto) * Number(l.cantidad || 0), 0);

  const lineasSinStock = lineas.filter((l) => l.idProducto && Number(l.cantidad) > saldoDe(l.idProducto));

  async function registrarVenta(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const detalle = lineas
        .filter((l) => l.idProducto && Number(l.cantidad) > 0)
        .map((l) => ({ idProducto: l.idProducto, cantidad: Number(l.cantidad) }));

      const { data } = await api.post('/ventas', {
        idCliente,
        idVehiculo,
        detalle,
        pago: { importe: subtotalEstimado, tipoPago },
      });

      setResultado(data);
      setIdCliente('');
      setIdVehiculo('');
      setLineas([{ ...lineaVacia }]);
      cargarTodo();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la venta');
    } finally {
      setGuardando(false);
    }
  }

  async function descargarTicket(idVenta) {
    try {
      const respuesta = await api.get(`/ventas/${idVenta}/ticket-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${idVenta}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el ticket');
    }
  }

  async function cancelarVenta(idVenta) {
    const motivo = prompt('Motivo de la cancelacion:');
    if (!motivo) return;
    try {
      await api.post(`/ventas/${idVenta}/cancelar`, { motivo });
      cargarTodo();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo cancelar la venta');
    }
  }

  return (
    <div>
      <Topbar />
      <div className="page" style={{ maxWidth: 1100 }}>
        <div className="page-header">
          <div>
            <h1>Ventas</h1>
            <p>Registra una venta y consulta las mas recientes</p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, alignItems: 'start' }}>
          {/* Formulario de nueva venta */}
          <div className="card">
            <h2 style={{ marginBottom: 16, fontSize: 16 }}>Nueva venta</h2>
            <form onSubmit={registrarVenta}>
              <div className="field">
                <label>Cliente</label>
                <select required value={idCliente} onChange={(e) => setIdCliente(e.target.value)} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {clientes.map((c) => (
                    <option key={c.idCliente} value={c.idCliente}>{c.idCliente} — {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Vehiculo</label>
                <select required value={idVehiculo} onChange={(e) => setIdVehiculo(e.target.value)} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {vehiculos.map((v) => (
                    <option key={v.idVehiculo} value={v.idVehiculo}>{v.idVehiculo} — {v.descripcion}</option>
                  ))}
                </select>
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Productos {!idVehiculo && <span style={{ textTransform: 'none', fontWeight: 400 }}>(elige un vehiculo para ver disponibilidad)</span>}
              </label>
              {lineas.map((linea, i) => {
                const saldoDisponible = linea.idProducto ? saldoDe(linea.idProducto) : null;
                const sinStock = linea.idProducto && saldoDisponible === 0;
                return (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        required
                        value={linea.idProducto}
                        onChange={(e) => actualizarProductoDeLinea(i, e.target.value)}
                        style={{ ...selectStyle, flex: 2, borderColor: sinStock ? 'var(--danger)' : 'var(--border)' }}
                      >
                        <option value="">Producto...</option>
                        {productos.map((p) => (
                          <option key={p.idProducto} value={p.idProducto}>
                            {p.descripcion} (${Number(p.precioVenta).toFixed(0)}){idVehiculo ? ` — disp: ${saldoDe(p.idProducto)}` : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        type="number"
                        min="1"
                        max={saldoDisponible ?? undefined}
                        disabled={sinStock}
                        value={linea.cantidad}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (saldoDisponible != null && val > saldoDisponible) val = saldoDisponible;
                          actualizarLinea(i, 'cantidad', val);
                        }}
                        style={{ ...selectStyle, flex: 1, borderColor: sinStock ? 'var(--danger)' : 'var(--border)' }}
                      />
                      {lineas.length > 1 && (
                        <button type="button" className="btn btn-ghost" onClick={() => quitarLinea(i)}>×</button>
                      )}
                    </div>
                    {sinStock && (
                      <p style={{ fontSize: 12, color: 'var(--danger)', margin: '4px 0 0' }}>
                        Sin existencia disponible en este vehiculo.
                      </p>
                    )}
                    {linea.idProducto && saldoDisponible > 0 && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Maximo disponible: {saldoDisponible}
                      </p>
                    )}
                  </div>
                );
              })}
              <button type="button" className="btn btn-ghost" onClick={agregarLinea} style={{ marginBottom: 20 }}>
                + Agregar producto
              </button>

              <div className="field">
                <label>Tipo de pago</label>
                <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)} style={selectStyle}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '18px 0', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal estimado (sin promos)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600 }}>${subtotalEstimado.toFixed(2)}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
                El total real (con promociones aplicadas) se calcula al confirmar.
              </p>

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={guardando || lineasSinStock.length > 0}>
                {guardando ? 'Registrando...' : 'Registrar venta'}
              </button>
            </form>

            {resultado && (
              <div style={{ marginTop: 20, padding: 16, background: 'rgba(208, 223, 146, 0.35)', border: '1px solid rgba(208, 223, 146, 0.9)', borderRadius: 8 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: 6 }}>Folio {resultado.idVenta}</p>
                {resultado.detalle.map((l, i) => (
                  <p key={i} style={{ fontSize: 13, margin: '2px 0', color: 'var(--text-secondary)' }}>
                    {l.cantidad}x {l.idProducto} {l.cantidadBonificada > 0 ? `(incluye ${l.cantidadBonificada} de regalo)` : ''} — ${l.subtotal.toFixed(2)}
                  </p>
                ))}
                <p style={{ fontWeight: 700, marginTop: 8 }}>Total: ${resultado.total.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Lista de ventas recientes */}
          <div className="card">
            <h2 style={{ marginBottom: 16, fontSize: 16 }}>Ventas recientes</h2>
            {cargando ? (
              <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
            ) : ventas.length === 0 ? (
              <div className="empty-state">Aun no hay ventas registradas.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Vehiculo</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((v) => (
                    <tr key={v.idVenta}>
                      <td>{v.idVenta}</td>
                      <td>{v.idCliente}</td>
                      <td>{v.idVehiculo}</td>
                      <td>${Number(v.total).toFixed(2)}</td>
                      <td>
                        <span className={`pill ${v.estado === 'Confirmada' ? 'pill-ok' : ''}`} style={v.estado === 'Cancelada' ? { background: 'rgba(179,38,30,0.1)', color: 'var(--danger)' } : {}}>
                          {v.estado}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost" onClick={() => descargarTicket(v.idVenta)}>Ticket</button>
                        {v.estado === 'Confirmada' && usuario?.rol === 'Admin' && (
                          <button className="btn btn-danger" onClick={() => cancelarVenta(v.idVenta)}>Cancelar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  width: '100%',
  padding: '11px 13px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  background: '#FFFFFF',
  color: 'var(--text-primary)',
};
