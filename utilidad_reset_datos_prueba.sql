/* =========================================================
   NEXTLEVELICE - Utilidad: RESET de datos de operacion
   Borra TODO lo transaccional (ventas, kardex, bitacoras,
   clientes de prueba, etc.) para dejar el sistema limpio
   antes de pruebas reales.

   SE CONSERVAN (catalogos base, no se tocan):
     - Productos
     - Vehiculos
     - Ubicaciones
     - Conceptos
     - Usuarios (para no perder accesos de login)

   ADVERTENCIA: Esto borra datos de forma permanente.
   No correr en un ambiente que ya tenga informacion real.
   ========================================================= */

USE NextLevelIce;
GO

BEGIN TRANSACTION;

-- Ventas y su detalle (respetando el orden por las llaves foraneas)
DELETE FROM Pagos;
DELETE FROM DetalleVenta;
DELETE FROM Ventas;
DELETE FROM Promociones;

-- Inventario / Kardex
DELETE FROM Kardex;
DELETE FROM Ubicaciones_Existencias;

-- Operacion de chofer
DELETE FROM Abastecimientos;
DELETE FROM MovimientosExtra;
DELETE FROM Bitacoras;
DELETE FROM Ubicacion_Actual;

-- Clientes y sus datos relacionados
DELETE FROM Contactos;
DELETE FROM Refrigeradores;
DELETE FROM Clientes;

-- Reiniciar el contador de folios de venta (para que vuelva a empezar en 00001)
DELETE FROM Contadores_Folio;

COMMIT TRANSACTION;
GO

-- Reiniciar los contadores de IDENTITY para que los nuevos registros
-- empiecen desde 1 otra vez (Contactos, Refrigeradores, Promociones)
DBCC CHECKIDENT ('Contactos', RESEED, 0);
DBCC CHECKIDENT ('Refrigeradores', RESEED, 0);
DBCC CHECKIDENT ('Promociones', RESEED, 0);
GO

-- Verificacion rapida: todo debe salir en 0, excepto lo que se conserva
SELECT 'Ventas' AS Tabla, COUNT(*) AS Filas FROM Ventas
UNION ALL SELECT 'Kardex', COUNT(*) FROM Kardex
UNION ALL SELECT 'Clientes', COUNT(*) FROM Clientes
UNION ALL SELECT 'Bitacoras', COUNT(*) FROM Bitacoras
UNION ALL SELECT 'Ubicaciones_Existencias', COUNT(*) FROM Ubicaciones_Existencias
UNION ALL SELECT '--- Se conservan ---', NULL
UNION ALL SELECT 'Productos (conservado)', COUNT(*) FROM Productos
UNION ALL SELECT 'Vehiculos (conservado)', COUNT(*) FROM Vehiculos
UNION ALL SELECT 'Ubicaciones (conservado)', COUNT(*) FROM Ubicaciones
UNION ALL SELECT 'Usuarios (conservado)', COUNT(*) FROM Usuarios;
GO
