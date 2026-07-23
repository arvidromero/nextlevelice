const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

function generarToken(usuario) {
  return jwt.sign(
    { email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// POST /api/auth/login-admin  { email, password }
async function loginAdmin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo || !usuario.passwordHash) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generarToken(usuario);
  res.json({ token, usuario: { email: usuario.email, nombre: usuario.nombre, rol: usuario.rol } });
}

// POST /api/auth/login-chofer  { email, pin }
async function loginChofer(req, res) {
  const { email, pin } = req.body;
  if (!email || !pin) {
    return res.status(400).json({ error: 'Correo y PIN son requeridos' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo || usuario.pin !== pin) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generarToken(usuario);
  res.json({ token, usuario: { email: usuario.email, nombre: usuario.nombre, rol: usuario.rol } });
}

module.exports = { loginAdmin, loginChofer };
