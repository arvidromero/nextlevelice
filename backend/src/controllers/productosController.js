const prisma = require('../config/db');

// GET /api/productos
async function listar(req, res) {
  const productos = await prisma.producto.findMany({ where: { activo: true } });
  res.json(productos);
}

// GET /api/productos/:id
async function obtener(req, res) {
  const producto = await prisma.producto.findUnique({ where: { idProducto: req.params.id } });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
}

// POST /api/productos  (solo Admin)
async function crear(req, res) {
  const { idProducto, descripcion, precioVenta, imagenURL } = req.body;
  if (!idProducto || !descripcion || precioVenta == null) {
    return res.status(400).json({ error: 'idProducto, descripcion y precioVenta son requeridos' });
  }

  const nuevo = await prisma.producto.create({
    data: { idProducto, descripcion, precioVenta, imagenURL },
  });
  res.status(201).json(nuevo);
}

// PUT /api/productos/:id  (solo Admin)
async function actualizar(req, res) {
  const { descripcion, precioVenta, imagenURL, activo } = req.body;
  const actualizado = await prisma.producto.update({
    where: { idProducto: req.params.id },
    data: { descripcion, precioVenta, imagenURL, activo },
  });
  res.json(actualizado);
}

// DELETE /api/productos/:id  (solo Admin -- baja lógica, nunca se borra físico)
async function desactivar(req, res) {
  await prisma.producto.update({
    where: { idProducto: req.params.id },
    data: { activo: false },
  });
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, desactivar };
