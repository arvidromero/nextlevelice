const prisma = require('../config/db');
const { mensajeAmigable } = require('../utils/errores');

// GET /api/promociones?idCliente=C00001
async function listar(req, res) {
  const { idCliente } = req.query;
  const promociones = await prisma.promocion.findMany({
    where: idCliente ? { idCliente } : {},
  });
  res.json(promociones);
}

// POST /api/promociones  (solo Admin)
// body: { idCliente, idProducto, cantidadCompra, cantidadBonificada, fechaVencimiento }
async function crear(req, res) {
  const { idCliente, idProducto, cantidadCompra, cantidadBonificada, fechaVencimiento } = req.body;
  if (!idCliente || !idProducto || !cantidadCompra || !cantidadBonificada || !fechaVencimiento) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const nueva = await prisma.promocion.create({
      data: { idCliente, idProducto, cantidadCompra, cantidadBonificada, fechaVencimiento: new Date(fechaVencimiento), usuarioCreacion: req.usuario.email },
    });
    res.status(201).json(nueva);
  } catch (err) {
    console.error('Error al crear promocion:', err.message); // para verlo en la terminal del backend
    res.status(400).json({ error: mensajeAmigable(err) });
  }
}

// DELETE /api/promociones/:id  (solo Admin -- desactiva, no borra)
async function desactivar(req, res) {
  await prisma.promocion.update({ where: { idPromocion: Number(req.params.id) }, data: { activa: false } });
  res.status(204).send();
}

module.exports = { listar, crear, desactivar };
