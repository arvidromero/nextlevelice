import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../api/client';
import Topbar from '../components/Topbar';

const filtrosVacios = { fechaDesde: '', fechaHasta: '', idCliente: '', usuario: '', idProducto: '' };

export default function Dashboard() {
  const [ventasHoy, setVentasHoy] = useState(null);
  const [porVehiculo, setPorVehiculo] = useState([]);
  const [porProducto, setPorProducto] = useState([]);
  const [porCliente, setPorCliente] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [mapaCalor, setMapaCalor] = useState([]);
  const [cortes, setCortes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoFiltrado, setCargandoFiltrado] = useState(false);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState(filtrosVacios);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosVacios);

  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const capaCalor = useRef(null);

  // Catalogos para los selects de filtro y para traducir IDs a nombres
  useEffect(() => {
    Promise.all([
      api.get('/vehiculos'),
      api.get('/productos'),
      api.get('/clientes'),
      api.get('/usuarios'),
      api.get('/dashboard/ventas-hoy'),
    ]).then(([vs, ps, cl, us, vh]) => {
      setVehiculos(vs.data);
      setProductos(ps.data);
      setClientes(cl.data);
      setChoferes(us.data.filter((u) => u.rol === 'Operador'));
      setVentasHoy(vh.data);
    }).catch(() => setError('No se pudo cargar la informacion base'));
  }, []);

  async function cargarDatosFiltrados(filtrosUsar) {
    setCargandoFiltrado(true);
    try {
      const params = Object.fromEntries(Object.entries(filtrosUsar).filter(([, v]) => v !== ''));
      const [pv, pp, pc, te, mc] = await Promise.all([
        api.get('/dashboard/por-vehiculo', { params }),
        api.get('/dashboard/por-producto', { params }),
        api.get('/dashboard/por-cliente', { params }),
        api.get('/dashboard/tendencia', { params }),
        api.get('/dashboard/mapa-calor', { params }),
      ]);
      setPorVehiculo(pv.data);
      setPorProducto(pp.data);
      setPorCliente(pc.data);
      setTendencia(te.data);
      setMapaCalor(mc.data);
    } catch (err) {
      setError('No se pudieron cargar los datos filtrados');
    } finally {
      setCargandoFiltrado(false);
      setCargando(false);
    }
  }

  useEffect(() => { cargarDatosFiltrados(filtrosVacios); }, []);

  useEffect(() => {
    api.get('/dashboard/cortes-caja-hoy').then(({ data }) => setCortes(data)).catch(() => {});
  }, []);

  function aplicarFiltros() {
    setFiltrosAplicados(filtros);
    cargarDatosFiltrados(filtros);
  }

  function limpiarFiltros() {
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
    cargarDatosFiltrados(filtrosVacios);
  }

  async function descargarCSV() {
    const params = Object.fromEntries(Object.entries(filtrosAplicados).filter(([, v]) => v !== ''));
    const respuesta = await api.get('/dashboard/exportar-csv', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Re-dibuja el mapa de calor cada vez que cambian los puntos
  useEffect(() => {
    if (!window.L || !mapaRef.current) return;

    if (!mapaInstancia.current) {
      mapaInstancia.current = window.L.map(mapaRef.current).setView([19.4326, -99.1332], 11);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaInstancia.current);
    }
    if (capaCalor.current) {
      mapaInstancia.current.removeLayer(capaCalor.current);
      capaCalor.current = null;
    }
    if (mapaCalor.length > 0) {
      const promedioLat = mapaCalor.reduce((a, p) => a + p.lat, 0) / mapaCalor.length;
      const promedioLng = mapaCalor.reduce((a, p) => a + p.lng, 0) / mapaCalor.length;
      mapaInstancia.current.setView([promedioLat, promedioLng], 12);
      capaCalor.current = window.L.heatLayer(mapaCalor.map((p) => [p.lat, p.lng, 0.6]), { radius: 30, blur: 20 }).addTo(mapaInstancia.current);
    }
  }, [mapaCalor]);

  function nombreVehiculo(id) { return vehiculos.find((v) => v.idVehiculo === id)?.descripcion ?? id; }
  function nombreProducto(id) { return productos.find((p) => p.idProducto === id)?.descripcion ?? id; }
  function nombreCliente(id) { return clientes.find((c) => c.idCliente === id)?.nombre ?? id; }

  function variacion(hoy, ayer) {
    if (!ayer) return null;
    return ((hoy - ayer) / ayer) * 100;
  }

  const datosPorVehiculo = porVehiculo.map((v) => ({ nombre: nombreVehiculo(v.idVehiculo), total: v.total }));
  const datosPorProducto = porProducto.map((p) => ({ nombre: nombreProducto(p.idProducto), total: p.total }));
  const datosTendencia = tendencia.map((t) => ({
    fecha: new Date(t.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    total: t.total,
  }));

  const hayFiltrosActivos = Object.values(filtrosAplicados).some((v) => v !== '');

  if (cargando) return (<div><Topbar /><div className="page"><p style={{ color: 'var(--text-secondary)' }}>Cargando dashboard...</p></div></div>);

  return (
    <div>
      <Topbar />
      <div className="page" style={{ maxWidth: 1200 }}>
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Panorama de ventas y operación</p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* KPIs de hoy -- siempre fijos, no usan los filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Ventas de hoy</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${ventasHoy?.hoy.toFixed(2)}</p>
            {ventasHoy?.ayer > 0 && (
              <p style={{ fontSize: 12, color: variacion(ventasHoy.hoy, ventasHoy.ayer) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {variacion(ventasHoy.hoy, ventasHoy.ayer) >= 0 ? '▲' : '▼'} {Math.abs(variacion(ventasHoy.hoy, ventasHoy.ayer)).toFixed(0)}% vs ayer
              </p>
            )}
          </div>
          <div className="card">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Ventas de ayer</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${ventasHoy?.ayer.toFixed(2)}</p>
          </div>
          <div className="card">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Promedio ultimos 7 dias</p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${ventasHoy?.promedio7dias.toFixed(2)}</p>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Desde</label>
              <input type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hasta</label>
              <input type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cliente</label>
              <select value={filtros.idCliente} onChange={(e) => setFiltros({ ...filtros, idCliente: e.target.value })} style={inputStyle}>
                <option value="">Todos</option>
                {clientes.map((c) => (<option key={c.idCliente} value={c.idCliente}>{c.nombre}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Operador</label>
              <select value={filtros.usuario} onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })} style={inputStyle}>
                <option value="">Todos</option>
                {choferes.map((c) => (<option key={c.email} value={c.email}>{c.nombre}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Producto</label>
              <select value={filtros.idProducto} onChange={(e) => setFiltros({ ...filtros, idProducto: e.target.value })} style={inputStyle}>
                <option value="">Todos</option>
                {productos.map((p) => (<option key={p.idProducto} value={p.idProducto}>{p.descripcion}</option>))}
              </select>
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={aplicarFiltros} disabled={cargandoFiltrado}>
              {cargandoFiltrado ? 'Aplicando...' : 'Aplicar filtros'}
            </button>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 18px' }} onClick={limpiarFiltros}>Limpiar</button>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 18px', marginLeft: 'auto' }} onClick={descargarCSV}>
              ⬇ Descargar CSV
            </button>
          </div>
          {hayFiltrosActivos && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
              Filtros activos -- las graficas de abajo y el CSV reflejan esta seleccion.
            </p>
          )}
        </div>

        {/* Ventas por vehiculo y por producto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 14 }}>Ventas por camioneta</h2>
            {datosPorVehiculo.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin ventas para este filtro.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={datosPorVehiculo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#E3007C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 14 }}>Ventas por producto</h2>
            {datosPorProducto.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin ventas para este filtro.</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={datosPorProducto} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#111113" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tendencia */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Tendencia</h2>
          {datosTendencia.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos para este filtro.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={datosTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="total" stroke="#E3007C" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top clientes y corte de caja */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 14 }}>Top clientes</h2>
            {porCliente.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos.</p> : (
              <table>
                <thead><tr><th>Cliente</th><th>Ventas</th><th>Total</th></tr></thead>
                <tbody>
                  {porCliente.map((c) => (
                    <tr key={c.idCliente}>
                      <td style={{ fontFamily: 'var(--font-body)' }}>{nombreCliente(c.idCliente)}</td>
                      <td>{c.numVentas}</td>
                      <td>${c.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 15, marginBottom: 14 }}>Corte de caja de hoy</h2>
            {cortes.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin bitácoras hoy.</p> : (
              <table>
                <thead><tr><th>Vehiculo</th><th>Chofer</th><th>A entregar</th></tr></thead>
                <tbody>
                  {cortes.map((c) => (
                    <tr key={c.idBitacora}>
                      <td style={{ fontFamily: 'var(--font-body)' }}>{nombreVehiculo(c.idVehiculo)}</td>
                      <td style={{ fontSize: 12 }}>{c.idChofer}</td>
                      <td style={{ fontWeight: 700 }}>${Number(c.TotalAEntregar).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Mapa de calor */}
        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Zonas de venta (mapa de calor)</h2>
          <div ref={mapaRef} style={{ height: 360, borderRadius: 8, overflow: 'hidden' }} />
          {mapaCalor.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Sin ventas con ubicación para este filtro.</p>}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 };
const inputStyle = { padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font-body)' };
