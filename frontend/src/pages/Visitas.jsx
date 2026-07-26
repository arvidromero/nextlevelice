import { useEffect, useState } from 'react';
import api, { urlImagen } from '../api/client';
import Topbar from '../components/Topbar';

export default function Visitas() {
  const [visitas, setVisitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fecha, setFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  async function cargar() {
    setCargando(true);
    try {
      const [visitasRes, clientesRes] = await Promise.all([
        api.get('/visitas', { params: fecha ? { fecha } : {} }),
        api.get('/clientes'),
      ]);
      setVisitas(visitasRes.data);
      setClientes(clientesRes.data);
    } catch (err) {
      setError('No se pudieron cargar las visitas');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [fecha]);

  function nombreCliente(id) {
    return clientes.find((c) => c.idCliente === id)?.nombre ?? id;
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Visitas sin venta</h1>
            <p>Reportes de clientes visitados que no compraron</p>
          </div>
        </div>

        <div className="toolbar" style={{ justifyContent: 'flex-start' }}>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ padding: '10px 13px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14 }} />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : visitas.length === 0 ? (
            <div className="empty-state">Sin visitas registradas para este filtro.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Chofer</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map((v) => (
                  <tr key={v.idVisita}>
                    <td>
                      {v.imagen ? (
                        <a href={urlImagen(v.imagen)} target="_blank" rel="noreferrer">
                          <img src={urlImagen(v.imagen)} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                        </a>
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: 6, background: '#F2F2F0' }} />
                      )}
                    </td>
                    <td>{new Date(v.fechaHora).toLocaleString('es-MX', { timeZone: 'UTC' })}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{nombreCliente(v.idCliente)}</td>
                    <td style={{ fontSize: 12 }}>{v.usuario}</td>
                    <td style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{v.notas || '—'}</td>
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
