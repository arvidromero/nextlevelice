import { useEffect, useState } from 'react';
import api from '../api/client';
import Topbar from '../components/Topbar';

const vacio = { email: '', nombre: '', rol: 'Operador', password: '', pin: '' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (err) {
      setError('No se pudieron cargar los usuarios');
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

  function abrirEditar(u) {
    setEditando(u);
    setForm({ email: u.email, nombre: u.nombre, rol: u.rol, password: '', pin: '' });
    setModalAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        const payload = { nombre: form.nombre };
        if (form.password) payload.password = form.password;
        if (form.pin) payload.pin = form.pin;
        await api.put(`/usuarios/${editando.email}`, payload);
      } else {
        await api.post('/usuarios', form);
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el usuario');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar(email) {
    if (!confirm(`¿Desactivar a ${email}? Ya no podra iniciar sesion.`)) return;
    await api.delete(`/usuarios/${email}`);
    cargar();
  }

  async function reactivar(u) {
    await api.put(`/usuarios/${u.email}`, { activo: true });
    cargar();
  }

  return (
    <div>
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Usuarios</h1>
            <p>Administradores y choferes con acceso al sistema</p>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>
        </div>

        <div className="card">
          {error && <div className="error-banner">{error}</div>}

          {cargando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : usuarios.length === 0 ? (
            <div className="empty-state">Aun no hay usuarios.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td style={{ fontFamily: 'var(--font-body)' }}>{u.nombre}</td>
                    <td>{u.rol}</td>
                    <td style={{ fontSize: 12 }}>
                      {u.tienePassword && 'Contraseña '}
                      {u.tienePin && 'PIN'}
                      {!u.tienePassword && !u.tienePin && '—'}
                    </td>
                    <td>
                      <span className="pill" style={u.activo ? { background: 'rgba(30,122,76,0.1)', color: 'var(--success)' } : { background: 'rgba(154,154,150,0.15)', color: 'var(--text-muted)' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => abrirEditar(u)}>Editar</button>
                      {u.activo ? (
                        <button className="btn btn-danger" onClick={() => desactivar(u.email)}>Desactivar</button>
                      ) : (
                        <button className="btn btn-ghost" onClick={() => reactivar(u)}>Reactivar</button>
                      )}
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
            <h2 style={{ marginBottom: 18 }}>{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            <form onSubmit={guardar}>
              <div className="field">
                <label>Correo</label>
                <input required type="email" disabled={!!editando} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              {!editando && (
                <div className="field">
                  <label>Rol</label>
                  <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                    <option value="Operador">Operador (chofer, entra con PIN)</option>
                    <option value="Admin">Admin (entra con correo y contraseña)</option>
                  </select>
                </div>
              )}
              {(editando ? editando.rol : form.rol) === 'Admin' ? (
                <div className="field">
                  <label>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                  <input type="password" required={!editando} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editando ? 'Dejar en blanco para no cambiar' : ''} />
                </div>
              ) : (
                <div className="field">
                  <label>{editando ? 'Nuevo PIN (opcional)' : 'PIN (4 digitos)'}</label>
                  <input maxLength={4} required={!editando} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder={editando ? 'Dejar en blanco para no cambiar' : ''} />
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
