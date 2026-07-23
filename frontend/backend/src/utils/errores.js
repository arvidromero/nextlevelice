// Traduce errores tecnicos de la base de datos a mensajes que un usuario entienda
function mensajeAmigable(err) {
  const msg = err.message || '';

  if (msg.includes('CK_UxE_SaldoNoNegativo')) {
    return 'No hay suficiente inventario disponible en esa ubicacion para completar la operacion.';
  }
  if (msg.includes('UX_Promociones_ClienteProductoActiva')) {
    return 'Ya existe una promocion activa para ese cliente y producto.';
  }
  if (msg.includes('UX_Usuarios_PIN')) {
    return 'Ese PIN ya esta en uso por otro chofer.';
  }
  if (msg.includes('PRIMARY KEY') || msg.includes('UNIQUE KEY') || msg.includes('duplicate key')) {
    return 'Ya existe un registro con ese identificador.';
  }
  if (msg.includes('FOREIGN KEY') || msg.includes('FK_')) {
    return 'Alguno de los datos relacionados (cliente, producto, vehiculo, etc.) no existe.';
  }

  return msg || 'Ocurrio un error inesperado.';
}

module.exports = { mensajeAmigable };
