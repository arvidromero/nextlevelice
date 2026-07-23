const prisma = require('../config/db');

// GET /api/clientes/:idCliente/refrigeradores
async function listarPorCliente(req, res) {
  const refrigeradores = await prisma.refrigerador.findMany({
    where: { idCliente: req.params.idCliente, activo: true },
  });
  res.json(refrigeradores);
}

async function crear(req, res) {
  const { idCliente, marca, modelo, serie, capacidad, formato, imagenURL } = req.body;
  if (!idCliente) {
    return res.status(400).json({ error: 'idCliente es requerido' });
  }

  const nuevo = await prisma.refrigerador.create({
    data: { idCliente, marca, modelo, serie, capacidad, formato, imagenURL },
  });
  res.status(201).json(nuevo);
}

async function actualizar(req, res) {
  const { marca, modelo, serie, capacidad, formato, imagenURL, activo } = req.body;
  const actualizado = await prisma.refrigerador.update({
    where: { idRefrigerador: Number(req.params.id) },
    data: { marca, modelo, serie, capacidad, formato, imagenURL, activo },
  });
  res.json(actualizado);
}

async function desactivar(req, res) {
  await prisma.refrigerador.update({ where: { idRefrigerador: Number(req.params.id) }, data: { activo: false } });
  res.status(204).send();
}

module.exports = { listarPorCliente, crear, actualizar, desactivar };
