import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Topbar from '../components/Topbar';

const vacio = { idCliente: '', nombre: '', telefono: '', direccion: '', email: '', credito: false, limiteCredito: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
    } catch (err) {
      setError('No se pudieron cargar los clientes');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  }

  function abrirEditar(cliente) {
    setEditando(cliente);
    setForm({
      idCliente: cliente.idCliente,
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      email: cliente.email || '',
      credito: cliente.credito || false,
      limiteCredito: cliente.limiteCredito != null ? cliente.limiteCredito : '',
    });
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        ...form,
        limiteCredito: form.credito && form.limiteCredito !== '' ? Number(form.limiteCredito) : null,
      };
      if (editando) {
        await api.put(`/clientes/${editando.idCliente}`, payload);
      } else {
        await api.post('/clientes', payload);
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(idCliente) {
    if (!confirm(`¿Desactivar al cliente ${idCliente}?`)) return;
    await api.delete(`/clientes/${idCliente}`);
    cargar();
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Clientes</h1>
            <p>Cuentas activas que reciben entregas de hielo</p>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo cliente</button>
        </div>

        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : clientes.length === 0 ? (
            <div className="empty-state">Aun no hay clientes registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Telefono</th>
                  <th>Factura</th>
                  <th>Credito</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.idCliente}>
                    <td>{c.idCliente}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{c.nombre}</td>
                    <td>{c.telefono || '—'}</td>
                    <td>{c.factura ? 'Si' : 'No'}</td>
                    <td>
                      {c.credito ? (
                        <span className="pill" style={{ background: 'rgba(30,122,76,0.1)', color: 'var(--success)' }}>
                          Debe ${Number(c.saldoCredito ?? 0).toFixed(0)} / ${Number(c.limiteCredito ?? 0).toFixed(0)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/clientes/${c.idCliente}`} className="btn btn-ghost" style={{ textDecoration: 'none', display: 'inline-block' }}>Ver detalle</Link>
                      <button className="btn btn-ghost" onClick={() => abrirEditar(c)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => desactivar(c.idCliente)}>Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 18 }}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={guardar}>
              <div className="field">
                <label>ID (ej. C00002)</label>
                <input required disabled={!!editando} value={form.idCliente} onChange={(e) => setForm({ ...form, idCliente: e.target.value })} />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="field">
                <label>Telefono</label>
                <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="field">
                <label>Direccion</label>
                <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="credito" checked={form.credito} onChange={(e) => setForm({ ...form, credito: e.target.checked })} style={{ width: 'auto' }} />
                <label htmlFor="credito" style={{ margin: 0, textTransform: 'none', fontWeight: 500, color: 'var(--text-primary)' }}>Este cliente puede comprar a crédito</label>
              </div>
              {form.credito && (
                <div className="field">
                  <label>Límite de crédito</label>
                  <input type="number" step="0.01" min="0" value={form.limiteCredito} onChange={(e) => setForm({ ...form, limiteCredito: e.target.value })} placeholder="Ej. 1000" />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
