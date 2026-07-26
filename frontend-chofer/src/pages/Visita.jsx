import { useEffect, useState } from 'react';
import api, { subirImagen, urlImagen } from '../api/client';
import { useBitacora } from '../context/BitacoraContext';

export default function Visita() {
  const { bitacora } = useBitacora();
  const [clientes, setClientes] = useState([]);
  const [visitasHoy, setVisitasHoy] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [notas, setNotas] = useState('');
  const [imagen, setImagen] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  function cargar() {
    api.get('/clientes').then(({ data }) => setClientes(data)).catch(() => {});
    api.get(`/bitacoras/${bitacora.idBitacora}/visitas`).then(({ data }) => setVisitasHoy(data)).catch(() => {});
  }

  useEffect(() => { cargar(); }, [bitacora.idBitacora]);

  function nombreCliente(id) {
    return clientes.find((c) => c.idCliente === id)?.nombre ?? id;
  }

  async function onFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirImagen(file);
      setImagen(url);
    } catch (err) {
      setError('No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  }

  async function registrarVisita(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    setOk('');
    try {
      await api.post(`/bitacoras/${bitacora.idBitacora}/visitas`, { idCliente, notas: notas || undefined, imagen: imagen || undefined });
      setOk('Visita registrada.');
      setIdCliente(''); setNotas(''); setImagen('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la visita');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 4, fontSize: 20 }}>Visita sin venta</h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Registra cuando visitas a un cliente pero no te compra.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {ok && <div className="ok-banner">{ok}</div>}

      <form onSubmit={registrarVisita}>
        <div className="field">
          <label>Cliente</label>
          <select required value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
            <option value="">Selecciona...</option>
            {clientes.map((c) => (<option key={c.idCliente} value={c.idCliente}>{c.nombre}</option>))}
          </select>
        </div>
        <div className="field">
          <label>Notas (opcional)</label>
          <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. No tenia efectivo, vuelvo mañana" />
        </div>
        <div className="field">
          <label>Foto (opcional)</label>
          {imagen && <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 6 }}>✓ Foto capturada</p>}
          <label className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
            📷 {imagen ? 'Tomar otra foto' : 'Tomar foto'}
            <input type="file" accept="image/*" capture="environment" onChange={onFoto} style={{ display: 'none' }} />
          </label>
          {subiendo && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Subiendo...</p>}
        </div>
        <button className="btn btn-brand" disabled={enviando || subiendo}>{enviando ? 'Registrando...' : 'Registrar visita'}</button>
      </form>

      {visitasHoy.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Visitas de hoy ({visitasHoy.length})</p>
          {visitasHoy.map((v) => (
            <div key={v.idVisita} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{nombreCliente(v.idCliente)}</p>
              {v.notas && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.notas}</p>}
              {v.imagen && <img src={urlImagen(v.imagen)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
