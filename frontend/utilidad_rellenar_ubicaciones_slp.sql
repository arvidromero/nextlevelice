/* =========================================================
   NEXTLEVELICE - Utilidad: rellenar Latitud/Longitud de ventas
   viejas (sin ubicacion) con puntos aleatorios dentro de la
   zona urbana de San Luis Potosi, Mexico. Solo para pruebas /
   demo del mapa de calor -- las ventas nuevas ya capturan su
   ubicacion real desde la app de Chofer.
   ========================================================= */

USE NextLevelIce;
GO

-- Zona urbana aproximada de SLP:
--   Latitud:  22.10 a 22.20
--   Longitud: -101.02 a -100.92

UPDATE Ventas
SET
    Latitud  = 22.10 + (CAST(ABS(CHECKSUM(NEWID())) AS FLOAT) / 2147483647.0) * (22.20 - 22.10),
    Longitud = -101.02 + (CAST(ABS(CHECKSUM(NEWID())) AS FLOAT) / 2147483647.0) * (-100.92 - (-101.02))
WHERE Latitud IS NULL
  AND Estado = 'Confirmada';
GO

-- Verifica cuantas filas quedaron con ubicacion
SELECT COUNT(*) AS VentasConUbicacion FROM Ventas WHERE Latitud IS NOT NULL;
GO
