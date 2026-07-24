import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

const INTERVALO_REFRESCO = 30 * 1000; // 30 segundos

export default function Mapa() {
  const [vehiculos, setVehiculos] = useState([]);
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadores = useRef({}); // idVehiculo -> L.marker

  useEffect(() => {
    api.get('/vehiculos').then(({ data }) => setVehiculos(data)).catch(() => {});
  }, []);

  function nombreVehiculo(id) {
    return vehiculos.find((v) => v.idVehiculo === id)?.descripcion ?? id;
  }

  // El backend guarda la hora local pero etiquetada como UTC (bug conocido
  // de Prisma+SQL Server), asi que hay que compensar el desfase de tu zona
  // horaria al comparar contra la hora real de ahorita.
  function minutosDesde(fecha) {
    const desfaseMs = new Date().getTimezoneOffset() * 60000;
    const horaRealGuardada = new Date(fecha).getTime() + desfaseMs;
    return Math.round((Date.now() - horaRealGuardada) / 60000);
  }

  function colorPorFrescura(fecha) {
    const min = minutosDesde(fecha);
    if (min <= 5) return '#1E7A4C';
    if (min <= 15) return '#A66A0E';
    return '#B3261E';
  }

  async function cargarDatos() {
    try {
      const { data } = await api.get('/ubicacion-actual/resumen');
      setDatos(data);
    } catch (err) {
      setError('No se pudo cargar la ubicación de las camionetas');
    }
  }

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, INTERVALO_REFRESCO);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!window.L || !mapaRef.current || mapaInstancia.current) return;
    mapaInstancia.current = window.L.map(mapaRef.current).setView([22.1565, -100.9855], 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaInstancia.current);
  }, []);

  useEffect(() => {
    if (!window.L || !mapaInstancia.current) return;
    const idsActuales = new Set(datos.map((d) => d.idVehiculo));

    Object.keys(marcadores.current).forEach((id) => {
      if (!idsActuales.has(id)) {
        mapaInstancia.current.removeLayer(marcadores.current[id]);
        delete marcadores.current[id];
      }
    });

    datos.forEach((d) => {
      const color = colorPorFrescura(d.fechaHora);
      const icono = window.L.divIcon({
        className: '',
        html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
      });
      const popupHtml = `
        <strong>${nombreVehiculo(d.idVehiculo)}</strong><br/>
        Chofer: ${d.idChofer ?? '—'}<br/>
        Existencia: ${d.existenciaTotal} piezas<br/>
        Ventas hoy: $${Number(d.ventasHoy).toFixed(2)}<br/>
        <span style="color:${color}">Actualizado hace ${minutosDesde(d.fechaHora)} min</span>
      `;

      if (marcadores.current[d.idVehiculo]) {
        marcadores.current[d.idVehiculo].setLatLng([d.latitud, d.longitud]).setIcon(icono).setPopupContent(popupHtml);
      } else {
        marcadores.current[d.idVehiculo] = window.L.marker([d.latitud, d.longitud], { icon: icono })
          .addTo(mapaInstancia.current)
          .bindPopup(popupHtml);
      }
    });
  }, [datos, vehiculos]);

  function irACamioneta(d) {
    setSeleccionado(d.idVehiculo);
    if (mapaInstancia.current) {
      mapaInstancia.current.setView([d.latitud, d.longitud], 15);
      marcadores.current[d.idVehiculo]?.openPopup();
    }
  }

  const activas = datos.length;
  const sinReportar = Math.max(vehiculos.length - datos.length, 0);

  return (
    <div className="app-shell-web">
      <Topbar />
      <div style={{ display: 'flex', height: 'calc(100vh - 61px)' }}>
        {/* Panel lateral */}
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '20px 18px', background: 'var(--surface)' }}>
          <h1 style={{ fontSize: 18, marginBottom: 2 }}>Mapa en vivo</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Camionetas en operación hoy</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{activas}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activas</div>
            </div>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{sinReportar}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sin reportar</div>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {datos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Ninguna camioneta ha reportado posición todavía hoy.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {datos.map((d) => (
                <div
                  key={d.idVehiculo}
                  onClick={() => irACamioneta(d)}
                  style={{
                    cursor: 'pointer',
                    border: `1px solid ${seleccionado === d.idVehiculo ? 'var(--accent, #E3007C)' : 'var(--border)'}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    background: seleccionado === d.idVehiculo ? 'rgba(227,0,124,0.05)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: colorPorFrescura(d.fechaHora), flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{nombreVehiculo(d.idVehiculo)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.idChofer}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {d.existenciaTotal} piezas · ${Number(d.ventasHoy).toFixed(0)} hoy · hace {minutosDesde(d.fechaHora)} min
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
            🟢 ≤5 min &nbsp; 🟡 6-15 min &nbsp; 🔴 &gt;15 min <br />
            Se actualiza cada 30 segundos.
          </p>
        </div>

        {/* Mapa */}
        <div ref={mapaRef} style={{ flex: 1 }} />
      </div>
    </div>
  );
}
