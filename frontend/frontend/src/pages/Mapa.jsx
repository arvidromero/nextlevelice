import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

const INTERVALO_REFRESCO = 30 * 1000; // 30 segundos

export default function Mapa() {
  const [vehiculos, setVehiculos] = useState([]);
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadores = useRef({}); // idVehiculo -> L.marker

  useEffect(() => {
    api.get('/vehiculos').then(({ data }) => setVehiculos(data)).catch(() => {});
  }, []);

  function nombreVehiculo(id) {
    return vehiculos.find((v) => v.idVehiculo === id)?.descripcion ?? id;
  }

  function minutosDesde(fecha) {
    return Math.round((Date.now() - new Date(fecha).getTime()) / 60000);
  }

  function colorPorFrescura(fecha) {
    const min = minutosDesde(fecha);
    if (min <= 5) return '#1E7A4C'; // verde -- reciente
    if (min <= 15) return '#A66A0E'; // amarillo -- tibio
    return '#B3261E'; // rojo -- viejo, puede estar sin señal
  }

  async function cargarDatos() {
    try {
      const { data } = await api.get('/ubicacion-actual/resumen');
      setDatos(data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      setError('No se pudo cargar la ubicación de las camionetas');
    }
  }

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, INTERVALO_REFRESCO);
    return () => clearInterval(intervalo);
  }, []);

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!window.L || !mapaRef.current || mapaInstancia.current) return;
    mapaInstancia.current = window.L.map(mapaRef.current).setView([22.1565, -100.9855], 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaInstancia.current);
  }, []);

  // Actualizar marcadores cada vez que llegan datos nuevos
  useEffect(() => {
    if (!window.L || !mapaInstancia.current) return;

    const idsActuales = new Set(datos.map((d) => d.idVehiculo));

    // Quitar marcadores de camionetas que ya no reportan
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

  return (
    <div>
      <Topbar />
      <div className="page" style={{ maxWidth: 1200 }}>
        <div className="page-header">
          <div>
            <h1>Mapa en vivo</h1>
            <p>Posición actual de las camionetas en operación</p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {ultimaActualizacion && `Actualizado: ${ultimaActualizacion.toLocaleTimeString('es-MX')}`}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {datos.length === 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Ninguna camioneta ha mandado su ubicación todavia hoy (necesitan tener una bitácora "En operación").
            </p>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div ref={mapaRef} style={{ height: 520 }} />
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          🟢 Actualizado hace 5 min o menos · 🟡 Hace 6-15 min · 🔴 Mas de 15 min (puede estar sin señal) · Se refresca solo cada 30 segundos.
        </p>
      </div>
    </div>
  );
}
