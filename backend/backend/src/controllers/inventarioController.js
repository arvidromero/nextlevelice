const prisma = require('../config/db');

// GET /api/inventario/conceptos
async function listarConceptos(req, res) {
  const conceptos = await prisma.concepto.findMany();
  res.json(conceptos);
}

// GET /api/inventario/existencias?idUbicacion=VH001
async function listarExistencias(req, res) {
  const { idUbicacion, idProducto } = req.query;
  const existencias = await prisma.ubicacionExistencia.findMany({
    where: {
      ...(idUbicacion ? { idUbicacion } : {}),
      ...(idProducto ? { idProducto } : {}),
    },
  });
  res.json(existencias);
}

// GET /api/inventario/kardex?idUbicacion=VH001&idProducto=NLC5K
async function listarKardex(req, res) {
  const { idUbicacion, idProducto } = req.query;
  const movimientos = await prisma.kardex.findMany({
    where: {
      ...(idUbicacion ? { idUbicacion } : {}),
      ...(idProducto ? { idProducto } : {}),
    },
    orderBy: { fechaHora: 'desc' },
    take: 100,
  });
  res.json(movimientos);
}

// Ejecuta el procedimiento y regresa el KardexID generado
async function ejecutarMovimiento({ idUbicacion, idProducto, cantidad, idConcepto, usuario, idMaquina, ubicacionDestino, referencia, notas }) {
  const rows = await prisma.$queryRaw`
    EXEC sp_RegistrarMovimientoKardex
      @idUbicacion = ${idUbicacion},
      @idProducto = ${idProducto},
      @Cantidad = ${cantidad},
      @idConcepto = ${idConcepto},
      @Usuario = ${usuario},
      @idMaquina = ${idMaquina ?? null},
      @Ubicacion_Destino = ${ubicacionDestino ?? null},
      @Referencia = ${referencia ?? null},
      @Notas = ${notas ?? null}
  `;
  return rows[0].KardexID;
}

// POST /api/inventario/movimientos
// Para movimientos sueltos: produccion (PRO), merma (MRM), devolucion (DEV),
// ajustes de inventario fisico (APO/ANE). NO usar para traspasos/retornos.
async function registrarMovimiento(req, res) {
  const { idUbicacion, idProducto, cantidad, idConcepto, idMaquina, referencia, notas } = req.body;

  if (!idUbicacion || !idProducto || !cantidad || !idConcepto) {
    return res.status(400).json({ error: 'idUbicacion, idProducto, cantidad e idConcepto son requeridos' });
  }
  if (['TOU', 'TIN', 'RET'].includes(idConcepto)) {
    return res.status(400).json({ error: 'Usa /api/inventario/traspasos para movimientos ligados (TOU/TIN/RET/APO)' });
  }

  try {
    const kardexID = await ejecutarMovimiento({
      idUbicacion, idProducto, cantidad, idConcepto,
      usuario: req.usuario.email, idMaquina, referencia, notas,
    });
    res.status(201).json({ kardexID });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// POST /api/inventario/traspasos
// Cubre traspaso entre camionetas (TOU/TIN) y retorno a camara (RET/APO) --
// es el mismo mecanismo: salida ligada a una entrada via Referencia.
async function registrarTraspaso(req, res) {
  const {
    idUbicacionOrigen, idUbicacionDestino, idProducto, cantidad,
    idConceptoSalida = 'TOU', idConceptoEntrada = 'TIN', notas,
  } = req.body;

  if (!idUbicacionOrigen || !idUbicacionDestino || !idProducto || !cantidad) {
    return res.status(400).json({ error: 'idUbicacionOrigen, idUbicacionDestino, idProducto y cantidad son requeridos' });
  }

  try {
    const kardexIDSalida = await ejecutarMovimiento({
      idUbicacion: idUbicacionOrigen,
      idProducto,
      cantidad,
      idConcepto: idConceptoSalida,
      usuario: req.usuario.email,
      ubicacionDestino: idUbicacionDestino,
      notas,
    });

    const kardexIDEntrada = await ejecutarMovimiento({
      idUbicacion: idUbicacionDestino,
      idProducto,
      cantidad,
      idConcepto: idConceptoEntrada,
      usuario: req.usuario.email,
      referencia: kardexIDSalida,
      notas: notas ? `${notas} (recibido de ${idUbicacionOrigen})` : `Recibido por traspaso desde ${idUbicacionOrigen}`,
    });

    res.status(201).json({ kardexIDSalida, kardexIDEntrada });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listarConceptos, listarExistencias, listarKardex, registrarMovimiento, registrarTraspaso };
