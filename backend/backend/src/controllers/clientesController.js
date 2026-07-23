const prisma = require('../config/db');

async function listar(req, res) {
  const clientes = await prisma.cliente.findMany({ where: { activo: true } });
  res.json(clientes);
}

async function obtener(req, res) {
  const cliente = await prisma.cliente.findUnique({ where: { idCliente: req.params.id } });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
}

async function crear(req, res) {
  const { idCliente, nombre, telefono, direccion, rfc, factura, credito, limiteCredito, diasCredito, latitud, longitud, email } = req.body;
  if (!idCliente || !nombre) {
    return res.status(400).json({ error: 'idCliente y nombre son requeridos' });
  }

  const nuevo = await prisma.cliente.create({
    data: { idCliente, nombre, telefono, direccion, rfc, factura, credito, limiteCredito, diasCredito, latitud, longitud, email },
  });
  res.status(201).json(nuevo);
}

async function actualizar(req, res) {
  const { nombre, telefono, direccion, rfc, factura, credito, limiteCredito, diasCredito, latitud, longitud, email, activo } = req.body;
  const actualizado = await prisma.cliente.update({
    where: { idCliente: req.params.id },
    data: { nombre, telefono, direccion, rfc, factura, credito, limiteCredito, diasCredito, latitud, longitud, email, activo },
  });
  res.json(actualizado);
}

async function desactivar(req, res) {
  await prisma.cliente.update({ where: { idCliente: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, desactivar };
