import { useEffect, useState } from 'react';
import api from '../api/client';
import { useBitacora } from '../context/BitacoraContext';

export default function Traspaso() {
  const { bitacora } = useBitacora();
  const [modo, setModo] = useState('traspaso'); // 'traspaso' | 'devolucion'
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [existencias, setExistencias] = useState([]);
  const [idDestino, setIdDestino] = useState('');
  const [idProducto, setIdProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/vehiculos'),
      api.get('/productos'),
      api.get('/inventario/existencias', { params: { idUbicacion: bitacora.idVehiculo } }),
    ]).then(([v, p, e]) => {
      setVehiculos(v.data.filter((x) => x.idVehiculo !== bitacora.idVehiculo));
      setProductos(p.data);
      setExistencias(e.data);
    });
  }, [bitacora.idVehiculo]);

  function saldoDe(id) {
    const e = existencias.find((x) => x.idProducto === id);
    return e ? e.saldo : 0;
  }

  async function enviarTraspaso(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    setOk('');
    try {
      await api.post('/inventario/traspasos', {
        idUbicacionOrigen: bitacora.idVehiculo,
        idUbicacionDestino: idDestino,
        idProducto,
        cantidad: Number(cantidad),
      });
      setOk('Traspaso registrado correctamente.');
      setIdProducto(''); setCantidad(1); setIdDestino('');
      api.get('/inventario/existencias', { params: { idUbicacion: bitacora.idVehiculo } }).then(({ data }) => setExistencias(data));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el traspaso');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarDevolucion(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    setOk('');
    try {
      await api.post('/inventario/movimientos', {
        idUbicacion: bitacora.idVehiculo,
        idProducto,
        cantidad: Number(cantidad),
        idConcepto: 'DEV',
        notas: 'Devolucion de cliente',
      });
      setOk('Devolucion registrada, se agrego a tu existencia.');
      setIdProducto(''); setCantidad(1);
      api.get('/inventario/existencias', { params: { idUbicacion: bitacora.idVehiculo } }).then(({ data }) => setExistencias(data));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la devolucion');
    } finally {
      setEnviando(false);
    }
  }

  const maxCantidad = modo === 'traspaso' && idProducto ? saldoDe(idProducto) : null;

  return (
    <div>
      <h1 style={{ marginBottom: 16, fontSize: 20 }}>Traspaso / devolución</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button type="button" className={modo === 'traspaso' ? 'btn btn-brand btn-sm' : 'btn btn-ghost btn-sm'} style={{ flex: 1 }} onClick={() => setModo('traspaso')}>
          A otra camioneta
        </button>
        <button type="button" className={modo === 'devolucion' ? 'btn btn-brand btn-sm' : 'btn btn-ghost btn-sm'} style={{ flex: 1 }} onClick={() => setModo('devolucion')}>
          Devolucion cliente
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {ok && <div className="ok-banner">{ok}</div>}

      {modo === 'traspaso' ? (
        <form onSubmit={enviarTraspaso}>
          <div className="field">
            <label>Enviar a</label>
            <select required value={idDestino} onChange={(e) => setIdDestino(e.target.value)}>
              <option value="">Selecciona...</option>
              {vehiculos.map((v) => (<option key={v.idVehiculo} value={v.idVehiculo}>{v.idVehiculo} — {v.descripcion}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Producto</label>
            <select required value={idProducto} onChange={(e) => { setIdProducto(e.target.value); setCantidad(1); }}>
              <option value="">Selecciona...</option>
              {existencias.filter((e) => e.saldo > 0).map((e) => {
                const p = productos.find((x) => x.idProducto === e.idProducto);
                return (<option key={e.idProducto} value={e.idProducto}>{p?.descripcion} — disp: {e.saldo}</option>);
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
          <button className="btn btn-brand" disabled={enviando}>{enviando ? 'Enviando...' : 'Registrar traspaso'}</button>
        </form>
      ) : (
        <form onSubmit={enviarDevolucion}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Cuando un cliente te regresa bolsas, registralas aqui para que vuelvan a tu existencia.
          </p>
          <div className="field">
            <label>Producto</label>
            <select required value={idProducto} onChange={(e) => setIdProducto(e.target.value)}>
              <option value="">Selecciona...</option>
              {productos.map((p) => (<option key={p.idProducto} value={p.idProducto}>{p.descripcion}</option>))}
            </select>
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input required type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
          </div>
          <button className="btn btn-brand" disabled={enviando}>{enviando ? 'Enviando...' : 'Registrar devolucion'}</button>
        </form>
      )}
    </div>
  );
}
