const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { mensajeAmigable } = require('../utils/errores');

function paraRespuesta(u) {
  return { email: u.email, nombre: u.nombre, rol: u.rol, activo: u.activo, tienePin: !!u.pin, tienePassword: !!u.passwordHash };
}

// GET /api/usuarios
async function listar(req, res) {
  const usuarios = await prisma.usuario.findMany({ orderBy: { fechaCreacion: 'desc' } });
  res.json(usuarios.map(paraRespuesta));
}

// POST /api/usuarios  body: { email, nombre, rol, password?, pin? }
async function crear(req, res) {
  const { email, nombre, rol, password, pin } = req.body;
  if (!email || !nombre || !rol) {
    return res.status(400).json({ error: 'email, nombre y rol son requeridos' });
  }
  if (!['Admin', 'Operador'].includes(rol)) {
    return res.status(400).json({ error: "rol debe ser 'Admin' u 'Operador'" });
  }

  const data = { email, nombre, rol };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (pin) data.pin = pin;

  try {
    const nuevo = await prisma.usuario.create({ data });
    res.status(201).json(paraRespuesta(nuevo));
  } catch (err) {
    res.status(400).json({ error: mensajeAmigable(err) });
  }
}

// PUT /api/usuarios/:email  body: { nombre?, activo?, password?, pin? }
async function actualizar(req, res) {
  const { nombre, activo, password, pin } = req.body;
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (activo !== undefined) data.activo = activo;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (pin) data.pin = pin;

  try {
    const actualizado = await prisma.usuario.update({ where: { email: req.params.email }, data });
    res.json(paraRespuesta(actualizado));
  } catch (err) {
    res.status(400).json({ error: mensajeAmigable(err) });
  }
}

// DELETE /api/usuarios/:email  -- baja logica
async function desactivar(req, res) {
  await prisma.usuario.update({ where: { email: req.params.email }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listar, crear, actualizar, desactivar };
