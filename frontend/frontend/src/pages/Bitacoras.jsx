import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

export default function Bitacoras() {
  const [bitacoras, setBitacoras] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aprobando, setAprobando] = useState(null);

  async function cargar() {
    setCargando(true);
    try {
      const [bitacorasRes, vehiculosRes] = await Promise.all([
        api.get('/bitacoras'),
        api.get('/vehiculos'),
      ]);
      setBitacoras(bitacorasRes.data);
      setVehiculos(vehiculosRes.data);
    } catch (err) {
      setError('No se pudieron cargar las bitacoras');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function nombreVehiculo(id) {
    const v = vehiculos.find((x) => x.idVehiculo === id);
    return v ? v.descripcion : id;
  }

  async function aprobar(idBitacora) {
    setAprobando(idBitacora);
    try {
      await api.patch(`/bitacoras/${idBitacora}/aprobar`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo aprobar la bitacora');
    } finally {
      setAprobando(null);
    }
  }

  async function descargarReporte(idBitacora, idVehiculo, fecha) {
    try {
      const respuesta = await api.get(`/bitacoras/${idBitacora}/reporte-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${idVehiculo}-${new Date(fecha).toISOString().slice(0, 10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el reporte');
    }
  }

  function colorEstado(estado) {
    if (estado === 'EnOperacion') return { background: 'rgba(30,122,76,0.1)', color: 'var(--success)' };
    if (estado === 'Cerrada') return { background: 'rgba(154,154,150,0.15)', color: 'var(--text-muted)' };
    return { background: 'rgba(166,106,14,0.12)', color: 'var(--warning)' }; // PendienteVoBo
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Bitácoras</h1>
            <p>Checklists matutinos de los choferes -- dales el VoBo para que puedan vender</p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : bitacoras.length === 0 ? (
            <div className="empty-state">Aun no hay bitacoras registradas.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehiculo</th>
                  <th>Chofer</th>
                  <th>Odometro inicial</th>
                  <th>Liquidos</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bitacoras.map((b) => (
                  <tr key={b.idBitacora}>
                    <td>{new Date(b.fecha).toLocaleDateString('es-MX')}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{nombreVehiculo(b.idVehiculo)}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{b.idChofer}</td>
                    <td>{b.odometroInicial ?? '—'} km</td>
                    <td style={{ fontSize: 12 }}>
                      Aceite: {b.varillaAntes ?? '—'} · Frenos: {b.liquidoFrenos ?? '—'} · Dir: {b.liquidoDireccion ?? '—'}
                    </td>
                    <td><span className="pill" style={colorEstado(b.estado)}>{b.estado}</span></td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      {b.estado === 'PendienteVoBo' && (
                        <button className="btn btn-primary" disabled={aprobando === b.idBitacora} onClick={() => aprobar(b.idBitacora)}>
                          {aprobando === b.idBitacora ? 'Aprobando...' : 'Dar VoBo'}
                        </button>
                      )}
                      <button className="btn btn-ghost" onClick={() => descargarReporte(b.idBitacora, b.idVehiculo, b.fecha)}>Reporte PDF</button>
                    </td>
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
