import { useEffect, useState } from 'react';
import api, { urlImagen } from '../api/client';
import { useBitacora } from '../context/BitacoraContext';

export default function Vender() {
  const { bitacora } = useBitacora();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [existencias, setExistencias] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [carrito, setCarrito] = useState({}); // { idProducto: cantidad }
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/clientes'),
      api.get('/productos'),
      api.get('/inventario/existencias', { params: { idUbicacion: bitacora.idVehiculo } }),
    ]).then(([c, p, e]) => {
      setClientes(c.data);
      setProductos(p.data);
      setExistencias(e.data);
    });
  }, [bitacora.idVehiculo]);

  function saldoDe(idProducto) {
    const e = existencias.find((x) => x.idProducto === idProducto);
    return e ? e.saldo : 0;
  }

  function precioDe(idProducto) {
    const p = productos.find((x) => x.idProducto === idProducto);
    return p ? Number(p.precioVenta) : 0;
  }

  function cambiarCantidad(idProducto, delta) {
    setCarrito((prev) => {
      const actual = prev[idProducto] || 0;
      const max = saldoDe(idProducto);
      const nueva = Math.max(0, Math.min(max, actual + delta));
      return { ...prev, [idProducto]: nueva };
    });
  }

  const lineasCarrito = Object.entries(carrito).filter(([, cant]) => cant > 0);
  const total = lineasCarrito.reduce((acc, [id, cant]) => acc + precioDe(id) * cant, 0);

  async function cobrar() {
    setEnviando(true);
    setError('');
    try {
      const detalle = lineasCarrito.map(([idProducto, cantidad]) => ({ idProducto, cantidad }));
      const { data } = await api.post('/ventas', {
        idCliente,
        idVehiculo: bitacora.idVehiculo,
        detalle,
        pago: { importe: total, tipoPago },
      });
      setResultado(data);
      setCarrito({});
      setIdCliente('');
      api.get('/inventario/existencias', { params: { idUbicacion: bitacora.idVehiculo } }).then(({ data }) => setExistencias(data));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la venta');
    } finally {
      setEnviando(false);
    }
  }

  async function obtenerTicketBlob() {
    const respuesta = await api.get(`/ventas/${resultado.idVenta}/ticket-pdf`, { responseType: 'blob' });
    return new Blob([respuesta.data], { type: 'application/pdf' });
  }

  async function descargarTicket() {
    const blob = await obtenerTicketBlob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${resultado.idVenta}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function compartirTicket() {
    const blob = await obtenerTicketBlob();
    const archivo = new File([blob], `ticket-${resultado.idVenta}.pdf`, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: `Ticket ${resultado.idVenta}` });
      } catch (err) {
        // el usuario cancelo el share, no es un error real
      }
    } else {
      descargarTicket();
    }
  }

  if (resultado) {
    return (
      <div>
        <div className="ok-banner">
          <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 8 }}>Folio {resultado.idVenta}</p>
          {resultado.detalle.map((l, i) => (
            <p key={i} style={{ fontSize: 13, margin: '2px 0' }}>
              {l.cantidad}x {l.idProducto} {l.cantidadBonificada > 0 ? `(${l.cantidadBonificada} de regalo)` : ''} — ${l.subtotal.toFixed(2)}
            </p>
          ))}
          <p style={{ fontWeight: 700, marginTop: 8, fontSize: 16 }}>Total: ${resultado.total.toFixed(2)}</p>
        </div>
        <button className="btn btn-brand" style={{ marginBottom: 10 }} onClick={compartirTicket}>📤 Compartir ticket</button>
        <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={descargarTicket}>Descargar ticket</button>
        <button className="btn btn-primary" onClick={() => setResultado(null)}>Nueva venta</button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 16, fontSize: 20 }}>Nueva venta</h1>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label>Cliente</label>
        <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
          <option value="">Selecciona...</option>
          {clientes.map((c) => (<option key={c.idCliente} value={c.idCliente}>{c.nombre}</option>))}
        </select>
      </div>

      <div className="card" style={{ padding: '8px 16px' }}>
        {productos.map((p) => {
          const saldo = saldoDe(p.idProducto);
          const cant = carrito[p.idProducto] || 0;
          return (
            <div className="producto-row" key={p.idProducto}>
              {p.imagenURL ? <img src={urlImagen(p.imagenURL)} alt="" /> : <div className="placeholder" />}
              <div className="info">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.descripcion}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>${Number(p.precioVenta).toFixed(0)} · disp: {saldo}</div>
              </div>
              <div className="cantidad-control">
                <button type="button" onClick={() => cambiarCantidad(p.idProducto, -1)} disabled={cant === 0}>−</button>
                <span>{cant}</span>
                <button type="button" onClick={() => cambiarCantidad(p.idProducto, 1)} disabled={cant >= saldo}>+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="field">
        <label>Tipo de pago</label>
        <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
        </select>
      </div>

      <div className="total-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Total estimado</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18 }}>${total.toFixed(2)}</span>
        </div>
        <button className="btn btn-brand" disabled={!idCliente || lineasCarrito.length === 0 || enviando} onClick={cobrar}>
          {enviando ? 'Cobrando...' : 'Cobrar'}
        </button>
      </div>
    </div>
  );
}
