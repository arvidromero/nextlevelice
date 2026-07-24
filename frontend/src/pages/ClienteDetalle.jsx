import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { subirImagen, urlImagen } from '../api/client';
import Topbar from '../components/Topbar';

export default function ClienteDetalle() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [refrigeradores, setRefrigeradores] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const contactoVacio = { nombre: '', puesto: '', telefono: '', email: '' };
  const refriVacio = { marca: '', modelo: '', serie: '', capacidad: '', imagenURL: '' };

  const [formContacto, setFormContacto] = useState(contactoVacio);
  const [editandoContacto, setEditandoContacto] = useState(null);
  const [formRefri, setFormRefri] = useState(refriVacio);
  const [editandoRefri, setEditandoRefri] = useState(null);
  const [formPromo, setFormPromo] = useState({ idProducto: '', cantidadCompra: 5, cantidadBonificada: 1, fechaVencimiento: '' });
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [guardandoRefri, setGuardandoRefri] = useState(false);
  const [subiendoImagenRefri, setSubiendoImagenRefri] = useState(false);
  const [guardandoPromo, setGuardandoPromo] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [clienteRes, contactosRes, refrisRes, promosRes, productosRes] = await Promise.all([
        api.get(`/clientes/${id}`),
        api.get(`/clientes/${id}/contactos`),
        api.get(`/clientes/${id}/refrigeradores`),
        api.get('/promociones', { params: { idCliente: id } }),
        api.get('/productos'),
      ]);
      setCliente(clienteRes.data);
      setContactos(contactosRes.data);
      setRefrigeradores(refrisRes.data);
      setPromociones(promosRes.data);
      setProductos(productosRes.data);
    } catch (err) {
      setError('No se pudo cargar la informacion del cliente');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [id]);

  // ---- Contactos ----
  function editarContacto(c) {
    setEditandoContacto(c);
    setFormContacto({ nombre: c.nombre, puesto: c.puesto || '', telefono: c.telefono || '', email: c.email || '' });
  }

  function cancelarEdicionContacto() {
    setEditandoContacto(null);
    setFormContacto(contactoVacio);
  }

  async function guardarContacto(e) {
    e.preventDefault();
    setGuardandoContacto(true);
    try {
      if (editandoContacto) {
        await api.put(`/clientes/contactos/${editandoContacto.idContacto}`, formContacto);
      } else {
        await api.post(`/clientes/${id}/contactos`, formContacto);
      }
      cancelarEdicionContacto();
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el contacto');
    } finally {
      setGuardandoContacto(false);
    }
  }

  async function quitarContacto(idContacto) {
    if (!confirm('¿Quitar este contacto?')) return;
    await api.delete(`/clientes/contactos/${idContacto}`);
    cargar();
  }

  // ---- Refrigeradores ----
  function editarRefri(r) {
    setEditandoRefri(r);
    setFormRefri({ marca: r.marca || '', modelo: r.modelo || '', serie: r.serie || '', capacidad: r.capacidad || '', imagenURL: r.imagenURL || '' });
  }

  function cancelarEdicionRefri() {
    setEditandoRefri(null);
    setFormRefri(refriVacio);
  }

  async function onSeleccionarImagenRefri(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoImagenRefri(true);
    try {
      const url = await subirImagen(file);
      setFormRefri((f) => ({ ...f, imagenURL: url }));
    } catch (err) {
      alert('No se pudo subir la imagen');
    } finally {
      setSubiendoImagenRefri(false);
    }
  }

  async function guardarRefrigerador(e) {
    e.preventDefault();
    setGuardandoRefri(true);
    try {
      if (editandoRefri) {
        await api.put(`/clientes/refrigeradores/${editandoRefri.idRefrigerador}`, formRefri);
      } else {
        await api.post(`/clientes/${id}/refrigeradores`, formRefri);
      }
      cancelarEdicionRefri();
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el refrigerador');
    } finally {
      setGuardandoRefri(false);
    }
  }

  async function quitarRefrigerador(idRefrigerador) {
    if (!confirm('¿Quitar este refrigerador?')) return;
    await api.delete(`/clientes/refrigeradores/${idRefrigerador}`);
    cargar();
  }

  // ---- Promociones ----
  async function agregarPromocion(e) {
    e.preventDefault();
    setGuardandoPromo(true);
    try {
      await api.post('/promociones', { ...formPromo, idCliente: id });
      setFormPromo({ idProducto: '', cantidadCompra: 5, cantidadBonificada: 1, fechaVencimiento: '' });
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo agregar la promocion');
    } finally {
      setGuardandoPromo(false);
    }
  }

  async function desactivarPromocion(idPromocion) {
    if (!confirm('¿Desactivar esta promocion?')) return;
    await api.delete(`/promociones/${idPromocion}`);
    cargar();
  }

  function nombreProducto(idProducto) {
    const p = productos.find((x) => x.idProducto === idProducto);
    return p ? p.descripcion : idProducto;
  }

  if (cargando) return (<div><Topbar /><div className="page"><p style={{ color: 'var(--text-secondary)' }}>Cargando...</p></div></div>);
  if (error || !cliente) return (<div><Topbar /><div className="page"><div className="error-banner">{error || 'Cliente no encontrado'}</div></div></div>);

  return (
    <div>
      <Topbar />
      <div className="page" style={{ maxWidth: 900 }}>
        <Link to="/clientes" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Volver a Clientes</Link>

        <div className="page-header" style={{ marginTop: 12 }}>
          <div>
            <h1>{cliente.nombre}</h1>
            <p>{cliente.idCliente} · {cliente.telefono || 'sin telefono'} · {cliente.direccion || 'sin direccion'}</p>
          </div>
        </div>

        {/* Contactos */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Contactos</h2>
          {contactos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Sin contactos registrados.</p>
          ) : (
            <table style={{ marginBottom: 16 }}>
              <thead><tr><th>Nombre</th><th>Puesto</th><th>Telefono</th><th>Email</th><th></th></tr></thead>
              <tbody>
                {contactos.map((c) => (
                  <tr key={c.idContacto}>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{c.nombre}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{c.puesto || '—'}</td>
                    <td>{c.telefono || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" onClick={() => editarContacto(c)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => quitarContacto(c.idContacto)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={guardarContacto} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Nombre" required value={formContacto.nombre} onChange={(e) => setFormContacto({ ...formContacto, nombre: e.target.value })} style={miniInput} />
            <input placeholder="Puesto" value={formContacto.puesto} onChange={(e) => setFormContacto({ ...formContacto, puesto: e.target.value })} style={miniInput} />
            <input placeholder="Telefono" value={formContacto.telefono} onChange={(e) => setFormContacto({ ...formContacto, telefono: e.target.value })} style={miniInput} />
            <input placeholder="Email" value={formContacto.email} onChange={(e) => setFormContacto({ ...formContacto, email: e.target.value })} style={miniInput} />
            <button className="btn btn-primary" disabled={guardandoContacto}>
              {editandoContacto ? (guardandoContacto ? 'Guardando...' : 'Guardar cambios') : '+ Agregar'}
            </button>
            {editandoContacto && (
              <button type="button" className="btn btn-ghost" onClick={cancelarEdicionContacto}>Cancelar</button>
            )}
          </form>
        </div>

        {/* Refrigeradores */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Refrigeradores en comodato</h2>
          {refrigeradores.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Sin refrigeradores registrados.</p>
          ) : (
            <table style={{ marginBottom: 16 }}>
              <thead><tr><th></th><th>Marca</th><th>Modelo</th><th>Serie</th><th>Capacidad</th><th></th></tr></thead>
              <tbody>
                {refrigeradores.map((r) => (
                  <tr key={r.idRefrigerador}>
                    <td>
                      {r.imagenURL ? (
                        <img src={urlImagen(r.imagenURL)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F2F2F0' }} />
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{r.marca || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{r.modelo || '—'}</td>
                    <td>{r.serie || '—'}</td>
                    <td>{r.capacidad || '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" onClick={() => editarRefri(r)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => quitarRefrigerador(r.idRefrigerador)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={guardarRefrigerador} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Marca" value={formRefri.marca} onChange={(e) => setFormRefri({ ...formRefri, marca: e.target.value })} style={miniInput} />
            <input placeholder="Modelo" value={formRefri.modelo} onChange={(e) => setFormRefri({ ...formRefri, modelo: e.target.value })} style={miniInput} />
            <input placeholder="Serie" value={formRefri.serie} onChange={(e) => setFormRefri({ ...formRefri, serie: e.target.value })} style={miniInput} />
            <input placeholder="Capacidad" value={formRefri.capacidad} onChange={(e) => setFormRefri({ ...formRefri, capacidad: e.target.value })} style={miniInput} />
            <input type="file" accept="image/*" onChange={onSeleccionarImagenRefri} style={{ fontSize: 12 }} />
            <button className="btn btn-primary" disabled={guardandoRefri || subiendoImagenRefri}>
              {subiendoImagenRefri ? 'Subiendo foto...' : editandoRefri ? (guardandoRefri ? 'Guardando...' : 'Guardar cambios') : '+ Agregar'}
            </button>
            {editandoRefri && (
              <button type="button" className="btn btn-ghost" onClick={cancelarEdicionRefri}>Cancelar</button>
            )}
          </form>
        </div>

        {/* Promociones */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Promociones</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Ej. "Compra 5, te damos 6" -&gt; Cantidad compra: 5, Cantidad bonificada: 1
          </p>
          {promociones.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Sin promociones para este cliente.</p>
          ) : (
            <table style={{ marginBottom: 16 }}>
              <thead><tr><th>Producto</th><th>Compra</th><th>Bonif.</th><th>Vence</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {promociones.map((p) => (
                  <tr key={p.idPromocion}>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{nombreProducto(p.idProducto)}</td>
                    <td>{p.cantidadCompra}</td>
                    <td>{p.cantidadBonificada}</td>
                    <td>{new Date(p.fechaVencimiento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td>
                    <td>
                      <span className="pill" style={p.activa ? { background: 'rgba(30,122,76,0.1)', color: 'var(--success)' } : { background: 'rgba(154,154,150,0.15)', color: 'var(--text-muted)' }}>
                        {p.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      {p.activa && <button className="btn btn-danger" onClick={() => desactivarPromocion(p.idPromocion)}>Desactivar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form onSubmit={agregarPromocion} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select required value={formPromo.idProducto} onChange={(e) => setFormPromo({ ...formPromo, idProducto: e.target.value })} style={miniInput}>
              <option value="">Producto...</option>
              {productos.map((p) => (<option key={p.idProducto} value={p.idProducto}>{p.descripcion}</option>))}
            </select>
            <input type="number" min="1" title="Cantidad compra" value={formPromo.cantidadCompra} onChange={(e) => setFormPromo({ ...formPromo, cantidadCompra: Number(e.target.value) })} style={{ ...miniInput, width: 70 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>compra</span>
            <input type="number" min="1" title="Cantidad bonificada" value={formPromo.cantidadBonificada} onChange={(e) => setFormPromo({ ...formPromo, cantidadBonificada: Number(e.target.value) })} style={{ ...miniInput, width: 70 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>gratis</span>
            <input type="date" required value={formPromo.fechaVencimiento} onChange={(e) => setFormPromo({ ...formPromo, fechaVencimiento: e.target.value })} style={miniInput} />
            <button className="btn btn-primary" disabled={guardandoPromo}>+ Agregar</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const miniInput = {
  padding: '9px 11px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  flex: '1 1 140px',
};
