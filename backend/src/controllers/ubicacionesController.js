const prisma = require('../config/db');

async function listar(req, res) {
  const ubicaciones = await prisma.ubicacion.findMany({ where: { activa: true } });
  res.json(ubicaciones);
}

async function obtener(req, res) {
  const ubicacion = await prisma.ubicacion.findUnique({ where: { idUbicacion: req.params.id } });
  if (!ubicacion) return res.status(404).json({ error: 'Ubicacion no encontrada' });
  res.json(ubicacion);
}

async function crear(req, res) {
  const { idUbicacion, nombre, tipo, idVehiculo } = req.body;
  if (!idUbicacion || !nombre || !tipo) {
    return res.status(400).json({ error: 'idUbicacion, nombre y tipo son requeridos' });
  }
  if (!['Camara', 'Vehiculo'].includes(tipo)) {
    return res.status(400).json({ error: "tipo debe ser 'Camara' o 'Vehiculo'" });
  }

  const nueva = await prisma.ubicacion.create({ data: { idUbicacion, nombre, tipo, idVehiculo } });
  res.status(201).json(nueva);
}

async function actualizar(req, res) {
  const { nombre, tipo, idVehiculo, activa } = req.body;
  const actualizada = await prisma.ubicacion.update({
    where: { idUbicacion: req.params.id },
    data: { nombre, tipo, idVehiculo, activa },
  });
  res.json(actualizada);
}

async function desactivar(req, res) {
  await prisma.ubicacion.update({ where: { idUbicacion: req.params.id }, data: { activa: false } });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, desactivar };
