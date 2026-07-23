const prisma = require('../config/db');

// ---- Abastecimientos (gas) ----

// GET /api/bitacoras/:idBitacora/abastecimientos
async function listarAbastecimientos(req, res) {
  const abastecimientos = await prisma.abastecimiento.findMany({
    where: { idBitacora: req.params.idBitacora },
    orderBy: { fechaHora: 'desc' },
  });
  res.json(abastecimientos);
}

// POST /api/bitacoras/:idBitacora/abastecimientos
// body: { litros?, importe, ubicacion?, evidencia? }
async function crearAbastecimiento(req, res) {
  const { litros, importe, ubicacion, evidencia } = req.body;
  if (importe == null) return res.status(400).json({ error: 'importe es requerido' });

  const bitacora = await prisma.bitacora.findUnique({ where: { idBitacora: req.params.idBitacora } });
  if (!bitacora) return res.status(404).json({ error: 'Bitacora no encontrada' });

  const nuevo = await prisma.abastecimiento.create({
    data: {
      idBitacora: req.params.idBitacora,
      idVehiculo: bitacora.idVehiculo,
      litros, importe, ubicacion, evidencia,
      usuario: req.usuario.email,
    },
  });
  res.status(201).json(nuevo);
}

// ---- Movimientos extra (gastos/ingresos libres del chofer) ----

// GET /api/bitacoras/:idBitacora/movimientos-extra
async function listarMovimientosExtra(req, res) {
  const movimientos = await prisma.movimientoExtra.findMany({
    where: { idBitacora: req.params.idBitacora },
    orderBy: { fechaHora: 'desc' },
  });
  res.json(movimientos);
}

// POST /api/bitacoras/:idBitacora/movimientos-extra
// body: { tipo: 'Gasto' | 'Ingreso', concepto, importe, evidencia? }
async function crearMovimientoExtra(req, res) {
  const { tipo, concepto, importe, evidencia } = req.body;
  if (!tipo || !concepto || importe == null) {
    return res.status(400).json({ error: 'tipo, concepto e importe son requeridos' });
  }
  if (!['Gasto', 'Ingreso'].includes(tipo)) {
    return res.status(400).json({ error: "tipo debe ser 'Gasto' o 'Ingreso'" });
  }

  const nuevo = await prisma.movimientoExtra.create({
    data: { idBitacora: req.params.idBitacora, tipo, concepto, importe, evidencia, usuario: req.usuario.email },
  });
  res.status(201).json(nuevo);
}

module.exports = { listarAbastecimientos, crearAbastecimiento, listarMovimientosExtra, crearMovimientoExtra };
