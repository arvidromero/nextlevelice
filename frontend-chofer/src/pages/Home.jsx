import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { subirImagen } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBitacora } from '../context/BitacoraContext';

const opcionesNivel = ['Full', 'Media', 'Baja'];

// Campo reutilizable: nivel (select) + foto obligatoria tomada con camara
function CampoConFoto({ etiqueta, nivel, onNivel, imagenUrl, onFoto, subiendo }) {
  return (
    <div className="field">
      <label>{etiqueta}</label>
      <select value={nivel} onChange={(e) => onNivel(e.target.value)} style={{ marginBottom: 8 }}>
        {opcionesNivel.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      {imagenUrl && <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 6 }}>✓ Foto capturada</p>}
      <label className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
        📷 {imagenUrl ? 'Tomar otra foto' : 'Tomar foto (obligatoria)'}
        <input type="file" accept="image/*" capture="environment" onChange={onFoto} style={{ display: 'none' }} />
      </label>
      {subiendo && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Subiendo...</p>}
    </div>
  );
}

export default function Home() {
  const { usuario } = useAuth();
  const { bitacora, cargando, refrescar } = useBitacora();
  const [vehiculos, setVehiculos] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [form, setForm] = useState({
    idVehiculo: '', odometroInicial: '',
    varillaAntes: 'Full', varillaAntesImagen: '',
    liquidoFrenos: 'Full', liquidoFrenosImagen: '',
    liquidoDireccion: 'Full', liquidoDireccionImagen: '',
    ayudante: '',
  });
  const [subiendo, setSubiendo] = useState({ varilla: false, frenos: false, direccion: false });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bitacora) {
      api.get('/vehiculos').then(({ data }) => setVehiculos(data)).catch(() => {});
      api.get('/usuarios/choferes').then(({ data }) => setChoferes(data.filter((c) => c.email !== usuario?.email))).catch(() => {});
    }
  }, [bitacora]);

  async function capturarFoto(e, campo, llaveSubiendo) {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo((s) => ({ ...s, [llaveSubiendo]: true }));
    try {
      const url = await subirImagen(file);
      setForm((f) => ({ ...f, [campo]: url }));
    } catch (err) {
      setError('No se pudo subir la foto, intenta otra vez');
    } finally {
      setSubiendo((s) => ({ ...s, [llaveSubiendo]: false }));
    }
  }

  const faltaAlgunaFoto = !form.varillaAntesImagen || !form.liquidoFrenosImagen || !form.liquidoDireccionImagen;

  async function enviarChecklist(e) {
    e.preventDefault();
    if (faltaAlgunaFoto) {
      setError('Faltan fotos por tomar: varilla, frenos y direccion son obligatorias');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await api.post('/bitacoras', { ...form, odometroInicial: Number(form.odometroInicial) });
      refrescar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el checklist');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 40 }}>Cargando...</p>;

  // Sin bitacora abierta hoy -> checklist matutino
  if (!bitacora) {
    return (
      <div>
        <h1 style={{ marginBottom: 4 }}>Checklist matutino</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          Revisa tu unidad antes de salir. Un Admin debe aprobarlo para que puedas vender.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={enviarChecklist}>
          <div className="field">
            <label>Vehiculo asignado</label>
            <select required value={form.idVehiculo} onChange={(e) => setForm({ ...form, idVehiculo: e.target.value })}>
              <option value="">Selecciona...</option>
              {vehiculos.map((v) => (
                <option key={v.idVehiculo} value={v.idVehiculo}>{v.idVehiculo} — {v.descripcion}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Odometro inicial (km)</label>
            <input required type="number" inputMode="numeric" value={form.odometroInicial} onChange={(e) => setForm({ ...form, odometroInicial: e.target.value })} />
          </div>

          <CampoConFoto
            etiqueta="Varilla de aceite"
            nivel={form.varillaAntes}
            onNivel={(v) => setForm({ ...form, varillaAntes: v })}
            imagenUrl={form.varillaAntesImagen}
            onFoto={(e) => capturarFoto(e, 'varillaAntesImagen', 'varilla')}
            subiendo={subiendo.varilla}
          />
          <CampoConFoto
            etiqueta="Liquido de frenos"
            nivel={form.liquidoFrenos}
            onNivel={(v) => setForm({ ...form, liquidoFrenos: v })}
            imagenUrl={form.liquidoFrenosImagen}
            onFoto={(e) => capturarFoto(e, 'liquidoFrenosImagen', 'frenos')}
            subiendo={subiendo.frenos}
          />
          <CampoConFoto
            etiqueta="Anticongelante / liquido de direccion"
            nivel={form.liquidoDireccion}
            onNivel={(v) => setForm({ ...form, liquidoDireccion: v })}
            imagenUrl={form.liquidoDireccionImagen}
            onFoto={(e) => capturarFoto(e, 'liquidoDireccionImagen', 'direccion')}
            subiendo={subiendo.direccion}
          />

          <div className="field">
            <label>Ayudante (opcional)</label>
            <select value={form.ayudante} onChange={(e) => setForm({ ...form, ayudante: e.target.value })}>
              <option value="">Ninguno</option>
              {choferes.map((c) => (<option key={c.email} value={c.email}>{c.nombre}</option>))}
            </select>
          </div>
          <button className="btn btn-brand" disabled={enviando || subiendo.varilla || subiendo.frenos || subiendo.direccion}>
            {enviando ? 'Enviando...' : 'Enviar checklist'}
          </button>
        </form>
      </div>
    );
  }

  // Esperando VoBo del Admin
  if (bitacora.estado === 'PendienteVoBo') {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Esperando aprobación</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Tu checklist para <strong>{bitacora.idVehiculo}</strong> ya se envió. Un Admin debe darte el visto bueno antes de que puedas vender.
        </p>
        <button className="btn btn-ghost" onClick={refrescar}>Actualizar estado</button>
      </div>
    );
  }

  // En operacion
  return (
    <div>
      <div className="card">
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Hoy estas en</p>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{bitacora.idVehiculo}</h1>
        <span className="pill pill-ok">En operacion</span>
      </div>

      <Link to="/vender" className="btn btn-brand" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
        🧊 Nueva venta
      </Link>
      <Link to="/traspaso" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
        🔁 Traspaso / devolucion
      </Link>
      <Link to="/gastos" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
        💵 Gasolina / gastos
      </Link>
    </div>
  );
}
