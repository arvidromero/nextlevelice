const prisma = require('../config/db');

// GET /api/bitacoras/:idBitacora/visitas
async function listarPorBitacora(req, res) {
  const visitas = await prisma.visita.findMany({
    where: { idBitacora: req.params.idBitacora },
    orderBy: { fechaHora: 'desc' },
  });
  res.json(visitas);
}

// POST /api/bitacoras/:idBitacora/visitas
// body: { idCliente, notas?, imagen? }
async function crear(req, res) {
  const { idCliente, notas, imagen } = req.body;
  if (!idCliente) return res.status(400).json({ error: 'idCliente es requerido' });

  const bitacora = await prisma.bitacora.findUnique({ where: { idBitacora: req.params.idBitacora } });
  if (!bitacora) return res.status(404).json({ error: 'Bitacora no encontrada' });

  const nueva = await prisma.visita.create({
    data: { idBitacora: req.params.idBitacora, idCliente, notas, imagen, usuario: req.usuario.email },
  });
  res.status(201).json(nueva);
}

// GET /api/visitas?fecha=YYYY-MM-DD  (para Operacion, todas las visitas)
async function listarTodas(req, res) {
  const { fecha } = req.query;
  let where = {};
  if (fecha) {
    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    const fin = new Date(`${fecha}T23:59:59.999Z`);
    where = { fechaHora: { gte: inicio, lte: fin } };
  }
  const visitas = await prisma.visita.findMany({ where, orderBy: { fechaHora: 'desc' }, take: 200 });
  res.json(visitas);
}

module.exports = { listarPorBitacora, crear, listarTodas };
