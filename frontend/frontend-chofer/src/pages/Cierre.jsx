import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useBitacora } from '../context/BitacoraContext';

export default function Cierre() {
  const { bitacora, refrescar } = useBitacora();
  const navigate = useNavigate();

  const [ubicaciones, setUbicaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [existencias, setExistencias] = useState([]);
  const [idCamara, setIdCamara] = useState('');
  const [idProducto, setIdProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [corte, setCorte] = useState(null);
  const [odometroFinal, setOdometroFinal] = useState('');
  const [varillaDespues, setVarillaDespues] = useState('Full');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  function cargarBase() {
    Promise.all([
      api.get('/ubicaciones'),
      api.get('/productos'),
      api.get('/inventario/existencias', { params: { idUbicacion: bitacora.idVehiculo } }),
      api.get(`/bitacoras/${bitacora.idBitacora}/corte-caja`),
    ]).then(([u, p, e, c]) => {
      setUbicaciones(u.data.filter((x) => x.tipo === 'Camara'));
      setProductos(p.data);
      setExistencias(e.data.filter((x) => x.saldo > 0));
      setCorte(c.data);
    });
  }

  useEffect(() => { cargarBase(); }, [bitacora.idVehiculo]);

  async function descargarReporte() {
    try {
      const respuesta = await api.get(`/bitacoras/${bitacora.idBitacora}/reporte-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${bitacora.idVehiculo}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el reporte');
    }
  }

  async function regresarACamara(e) {
    e.preventDefault();
    setEnviando(true); setError(''); setOk('');
    try {
      await api.post('/inventario/traspasos', {
        idUbicacionOrigen: bitacora.idVehiculo,
        idUbicacionDestino: idCamara,
        idProducto,
        cantidad: Number(cantidad),
        idConceptoSalida: 'RET',
        idConceptoEntrada: 'APO',
      });
      setOk('Producto regresado a camara.');
      setIdProducto(''); setCantidad(1);
      cargarBase();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo regresar el producto');
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarDia(e) {
    e.preventDefault();
    if (existencias.length > 0) {
      if (!confirm('Todavia tienes producto en tu camioneta. ¿Cerrar de todas formas?')) return;
    }
    setEnviando(true); setError('');
    try {
      await api.patch(`/bitacoras/${bitacora.idBitacora}/cerrar`, {
        odometroFinal: Number(odometroFinal),
        varillaDespues,
      });
      refrescar();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cerrar el dia');
    } finally {
      setEnviando(false);
    }
  }

  const maxCantidad = idProducto ? (existencias.find((e) => e.idProducto === idProducto)?.saldo ?? 0) : null;

  return (
    <div>
      <h1 style={{ marginBottom: 16, fontSize: 20 }}>Cierre de día</h1>

      {corte && (
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Corte de caja de hoy</p>
          <p style={{ fontSize: 13, margin: '2px 0' }}>Ventas: ${Number(corte.TotalVentas).toFixed(2)}</p>
          <p style={{ fontSize: 13, margin: '2px 0' }}>Gasolina: -${Number(corte.TotalAbastecimientos).toFixed(2)}</p>
          <p style={{ fontSize: 13, margin: '2px 0' }}>Gastos: -${Number(corte.TotalGastos).toFixed(2)}</p>
          <p style={{ fontSize: 13, margin: '2px 0' }}>Ingresos extra: +${Number(corte.TotalIngresos).toFixed(2)}</p>
          <p style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>A entregar: ${Number(corte.TotalAEntregar).toFixed(2)}</p>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={descargarReporte}>Descargar reporte PDF</button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {ok && <div className="ok-banner">{ok}</div>}

      {existencias.length > 0 && (
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Regresar producto a cámara</p>
          <form onSubmit={regresarACamara}>
            <div className="field">
              <label>Cámara destino</label>
              <select required value={idCamara} onChange={(e) => setIdCamara(e.target.value)}>
                <option value="">Selecciona...</option>
                {ubicaciones.map((u) => (<option key={u.idUbicacion} value={u.idUbicacion}>{u.idUbicacion} — {u.nombre}</option>))}
              </select>
            </div>
            <div className="field">
              <label>Producto</label>
              <select required value={idProducto} onChange={(e) => { setIdProducto(e.target.value); setCantidad(1); }}>
                <option value="">Selecciona...</option>
                {existencias.map((e) => {
                  const p = productos.find((x) => x.idProducto === e.idProducto);
                  return (<option key={e.idProducto} value={e.idProducto}>{p?.descripcion} — te quedan: {e.saldo}</option>);
                })}
              </select>
            </div>
            <div className="field">
              <label>Cantidad {maxCantidad != null && `(max ${maxCantidad})`}</label>
              <input required type="number" min="1" max={maxCantidad ?? undefined} value={cantidad}
                onChange={(e) => {
                  let v = Number(e.target.value);
                  if (maxCantidad != null && v > maxCantidad) v = maxCantidad;
                  setCantidad(v);
                }} />
            </div>
            <button className="btn btn-ghost" disabled={enviando}>{enviando ? 'Enviando...' : 'Regresar a cámara'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Cerrar mi día</p>
        {existencias.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 12 }}>
            ⚠️ Todavia tienes {existencias.length} producto(s) en tu camioneta.
          </p>
        )}
        <form onSubmit={cerrarDia}>
          <div className="field">
            <label>Odómetro final (km)</label>
            <input required type="number" inputMode="numeric" value={odometroFinal} onChange={(e) => setOdometroFinal(e.target.value)} />
          </div>
          <div className="field">
            <label>Varilla de aceite</label>
            <select value={varillaDespues} onChange={(e) => setVarillaDespues(e.target.value)}>
              <option value="Full">Full</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Cerrando...' : 'Cerrar día'}</button>
        </form>
      </div>
    </div>
  );
}
