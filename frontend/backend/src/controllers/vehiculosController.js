const prisma = require('../config/db');

async function listar(req, res) {
  const vehiculos = await prisma.vehiculo.findMany({ where: { activo: true } });
  res.json(vehiculos);
}

async function obtener(req, res) {
  const vehiculo = await prisma.vehiculo.findUnique({ where: { idVehiculo: req.params.id } });
  if (!vehiculo) return res.status(404).json({ error: 'Vehiculo no encontrado' });
  res.json(vehiculo);
}

async function crear(req, res) {
  const { idVehiculo, placa, descripcion } = req.body;
  if (!idVehiculo || !descripcion) {
    return res.status(400).json({ error: 'idVehiculo y descripcion son requeridos' });
  }

  const nuevo = await prisma.vehiculo.create({ data: { idVehiculo, placa, descripcion } });
  res.status(201).json(nuevo);
}

async function actualizar(req, res) {
  const { placa, descripcion, odometroActual, activo } = req.body;
  const actualizado = await prisma.vehiculo.update({
    where: { idVehiculo: req.params.id },
    data: { placa, descripcion, odometroActual, activo },
  });
  res.json(actualizado);
}

async function desactivar(req, res) {
  await prisma.vehiculo.update({ where: { idVehiculo: req.params.id }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, desactivar };
