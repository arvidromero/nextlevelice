const prisma = require('../config/db');

// GET /api/clientes/:idCliente/contactos
async function listarPorCliente(req, res) {
  const contactos = await prisma.contacto.findMany({
    where: { idCliente: req.params.idCliente, activo: true },
  });
  res.json(contactos);
}

async function crear(req, res) {
  const { idCliente, nombre, puesto, telefono, email } = req.body;
  if (!idCliente || !nombre) {
    return res.status(400).json({ error: 'idCliente y nombre son requeridos' });
  }

  const nuevo = await prisma.contacto.create({ data: { idCliente, nombre, puesto, telefono, email } });
  res.status(201).json(nuevo);
}

async function actualizar(req, res) {
  const { nombre, puesto, telefono, email, activo } = req.body;
  const actualizado = await prisma.contacto.update({
    where: { idContacto: Number(req.params.id) },
    data: { nombre, puesto, telefono, email, activo },
  });
  res.json(actualizado);
}

async function desactivar(req, res) {
  await prisma.contacto.update({ where: { idContacto: Number(req.params.id) }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listarPorCliente, crear, actualizar, desactivar };
