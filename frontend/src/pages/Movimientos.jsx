import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

export default function Movimientos() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [kardex, setKardex] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Ingreso de produccion
  const [ingreso, setIngreso] = useState({ idUbicacion: '', idProducto: '', cantidad: 1, idMaquina: '', notas: '' });
  const [guardandoIngreso, setGuardandoIngreso] = useState(false);
  const [okIngreso, setOkIngreso] = useState('');

  // Traspaso entre ubicaciones
  const [traspaso, setTraspaso] = useState({ idUbicacionOrigen: '', idUbicacionDestino: '', idProducto: '', cantidad: 1, notas: '' });
  const [existenciasOrigen, setExistenciasOrigen] = useState([]);
  const [guardandoTraspaso, setGuardandoTraspaso] = useState(false);
  const [okTraspaso, setOkTraspaso] = useState('');

  async function cargarBase() {
    setCargando(true);
    try {
      const [ubicacionesRes, productosRes, kardexRes] = await Promise.all([
        api.get('/ubicaciones'),
        api.get('/productos'),
        api.get('/inventario/kardex'),
      ]);
      setUbicaciones(ubicacionesRes.data);
      setProductos(productosRes.data);
      setKardex(kardexRes.data.slice(0, 15));
    } catch (err) {
      setError('No se pudo cargar la informacion');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarBase(); }, []);

  useEffect(() => {
    if (!traspaso.idUbicacionOrigen) { setExistenciasOrigen([]); return; }
    api.get('/inventario/existencias', { params: { idUbicacion: traspaso.idUbicacionOrigen } })
      .then(({ data }) => setExistenciasOrigen(data))
      .catch(() => setExistenciasOrigen([]));
  }, [traspaso.idUbicacionOrigen]);

  function nombreUbicacion(id) {
    const u = ubicaciones.find((x) => x.idUbicacion === id);
    return u ? u.nombre : id;
  }
  function nombreProducto(id) {
    const p = productos.find((x) => x.idProducto === id);
    return p ? p.descripcion : id;
  }
  function saldoOrigenDe(idProducto) {
    const e = existenciasOrigen.find((x) => x.idProducto === idProducto);
    return e ? e.saldo : 0;
  }

  async function registrarIngreso(e) {
    e.preventDefault();
    setGuardandoIngreso(true);
    setOkIngreso('');
    setError('');
    try {
      await api.post('/inventario/movimientos', {
        idUbicacion: ingreso.idUbicacion,
        idProducto: ingreso.idProducto,
        cantidad: Number(ingreso.cantidad),
        idConcepto: 'PRO',
        idMaquina: ingreso.idMaquina || undefined,
        notas: ingreso.notas || undefined,
      });
      setOkIngreso(`Se agregaron ${ingreso.cantidad} piezas a ${nombreUbicacion(ingreso.idUbicacion)}.`);
      setIngreso({ idUbicacion: '', idProducto: '', cantidad: 1, idMaquina: '', notas: '' });
      cargarBase();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el ingreso');
    } finally {
      setGuardandoIngreso(false);
    }
  }

  async function registrarTraspaso(e) {
    e.preventDefault();
    setGuardandoTraspaso(true);
    setOkTraspaso('');
    setError('');
    try {
      await api.post('/inventario/traspasos', {
        idUbicacionOrigen: traspaso.idUbicacionOrigen,
        idUbicacionDestino: traspaso.idUbicacionDestino,
        idProducto: traspaso.idProducto,
        cantidad: Number(traspaso.cantidad),
        notas: traspaso.notas || undefined,
      });
      setOkTraspaso(`Se traspasaron ${traspaso.cantidad} piezas de ${nombreUbicacion(traspaso.idUbicacionOrigen)} a ${nombreUbicacion(traspaso.idUbicacionDestino)}.`);
      setTraspaso({ idUbicacionOrigen: '', idUbicacionDestino: '', idProducto: '', cantidad: 1, notas: '' });
      cargarBase();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el traspaso');
    } finally {
      setGuardandoTraspaso(false);
    }
  }

  const saldoDisponibleTraspaso = traspaso.idProducto ? saldoOrigenDe(traspaso.idProducto) : null;

  return (
    <div>
      <Topbar />
      <div className="page" style={{ maxWidth: 1100 }}>
        <div className="page-header">
          <div>
            <h1>Movimientos</h1>
            <p>Ingreso de produccion y traspasos entre camaras y camionetas</p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Ingreso de produccion */}
          <div className="card">
            <h2 style={{ marginBottom: 4, fontSize: 16 }}>Ingreso de producción</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Cuando sale hielo de producción hacia una camara o directo a una camioneta.
            </p>
            <form onSubmit={registrarIngreso}>
              <div className="field">
                <label>Ubicacion destino</label>
                <select required value={ingreso.idUbicacion} onChange={(e) => setIngreso({ ...ingreso, idUbicacion: e.target.value })} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {ubicaciones.map((u) => (
                    <option key={u.idUbicacion} value={u.idUbicacion}>{u.idUbicacion} — {u.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Producto</label>
                <select required value={ingreso.idProducto} onChange={(e) => setIngreso({ ...ingreso, idProducto: e.target.value })} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {productos.map((p) => (
                    <option key={p.idProducto} value={p.idProducto}>{p.descripcion}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cantidad</label>
                <input required type="number" min="1" value={ingreso.cantidad} onChange={(e) => setIngreso({ ...ingreso, cantidad: e.target.value })} style={selectStyle} />
              </div>
              <div className="field">
                <label>Maquina (opcional)</label>
                <input value={ingreso.idMaquina} onChange={(e) => setIngreso({ ...ingreso, idMaquina: e.target.value })} style={selectStyle} placeholder="Maquina 1" />
              </div>
              <div className="field">
                <label>Notas (opcional)</label>
                <input value={ingreso.notas} onChange={(e) => setIngreso({ ...ingreso, notas: e.target.value })} style={selectStyle} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={guardandoIngreso}>
                {guardandoIngreso ? 'Registrando...' : 'Registrar ingreso'}
              </button>
            </form>
            {okIngreso && (
              <div style={{ marginTop: 14, padding: 12, background: 'rgba(208, 223, 146, 0.35)', border: '1px solid rgba(208, 223, 146, 0.9)', borderRadius: 8, fontSize: 13 }}>
                {okIngreso}
              </div>
            )}
          </div>

          {/* Traspaso entre ubicaciones */}
          <div className="card">
            <h2 style={{ marginBottom: 4, fontSize: 16 }}>Traspaso entre ubicaciones</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Para resurtir una camioneta desde otra, o regresar producto a una camara.
            </p>
            <form onSubmit={registrarTraspaso}>
              <div className="field">
                <label>Origen</label>
                <select required value={traspaso.idUbicacionOrigen} onChange={(e) => setTraspaso({ ...traspaso, idUbicacionOrigen: e.target.value, idProducto: '', cantidad: 1 })} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {ubicaciones.map((u) => (
                    <option key={u.idUbicacion} value={u.idUbicacion}>{u.idUbicacion} — {u.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Destino</label>
                <select required value={traspaso.idUbicacionDestino} onChange={(e) => setTraspaso({ ...traspaso, idUbicacionDestino: e.target.value })} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {ubicaciones.filter((u) => u.idUbicacion !== traspaso.idUbicacionOrigen).map((u) => (
                    <option key={u.idUbicacion} value={u.idUbicacion}>{u.idUbicacion} — {u.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Producto {!traspaso.idUbicacionOrigen && <span style={{ fontWeight: 400 }}>(elige origen primero)</span>}</label>
                <select
                  required
                  disabled={!traspaso.idUbicacionOrigen}
                  value={traspaso.idProducto}
                  onChange={(e) => setTraspaso({ ...traspaso, idProducto: e.target.value, cantidad: 1 })}
                  style={selectStyle}
                >
                  <option value="">Selecciona...</option>
                  {existenciasOrigen.filter((e) => e.saldo > 0).map((e) => (
                    <option key={e.idProducto} value={e.idProducto}>{nombreProducto(e.idProducto)} — disp: {e.saldo}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cantidad {saldoDisponibleTraspaso != null && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(max {saldoDisponibleTraspaso})</span>}</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={saldoDisponibleTraspaso ?? undefined}
                  disabled={!traspaso.idProducto}
                  value={traspaso.cantidad}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (saldoDisponibleTraspaso != null && val > saldoDisponibleTraspaso) val = saldoDisponibleTraspaso;
                    setTraspaso({ ...traspaso, cantidad: val });
                  }}
                  style={selectStyle}
                />
              </div>
              <div className="field">
                <label>Notas (opcional)</label>
                <input value={traspaso.notas} onChange={(e) => setTraspaso({ ...traspaso, notas: e.target.value })} style={selectStyle} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={guardandoTraspaso}>
                {guardandoTraspaso ? 'Registrando...' : 'Registrar traspaso'}
              </button>
            </form>
            {okTraspaso && (
              <div style={{ marginTop: 14, padding: 12, background: 'rgba(208, 223, 146, 0.35)', border: '1px solid rgba(208, 223, 146, 0.9)', borderRadius: 8, fontSize: 13 }}>
                {okTraspaso}
              </div>
            )}
          </div>
        </div>

        {/* Movimientos recientes */}
        <div className="card" style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 14, fontSize: 16 }}>Movimientos recientes</h2>
          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : kardex.length === 0 ? (
            <div className="empty-state">Aun no hay movimientos registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ubicacion</th>
                  <th>Producto</th>
                  <th>Concepto</th>
                  <th>Operacion</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {kardex.map((k) => (
                  <tr key={k.kardexID}>
                    <td>{new Date(k.fechaHora).toLocaleString('es-MX')}</td>
                    <td>{nombreUbicacion(k.idUbicacion)}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{nombreProducto(k.idProducto)}</td>
                    <td>{k.idConcepto}</td>
                    <td>{k.operacion}</td>
                    <td style={{ fontWeight: 700 }}>{k.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
