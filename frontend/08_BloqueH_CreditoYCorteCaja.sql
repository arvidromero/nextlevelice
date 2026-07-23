/* =========================================================
   NEXTLEVELICE - Fase 0 / Bloque H: Credito, evidencia de pago,
   y correccion del corte de caja (solo cuenta efectivo real)
   ========================================================= */

USE NextLevelIce;
GO

-- 1. Agregar 'Credito' como tipo de pago valido
ALTER TABLE Pagos DROP CONSTRAINT CK_Pagos_Tipo;
GO
ALTER TABLE Pagos ADD CONSTRAINT CK_Pagos_Tipo
    CHECK (TipoPago IN ('Efectivo', 'Transferencia', 'Tarjeta', 'Credito'));
GO

-- 2. Corregir vw_CorteCaja: el "Total a entregar" debe salir SOLO del
--    efectivo realmente cobrado (Pagos.TipoPago = 'Efectivo'), no del
--    total de la venta -- si fue transferencia o credito, el chofer
--    no trae ese dinero fisico.
DROP VIEW IF EXISTS vw_CorteCaja;
GO

CREATE VIEW vw_CorteCaja AS
SELECT
    b.idBitacora,
    b.idVehiculo,
    b.idChofer,
    b.Fecha,
    ISNULL(v.TotalEfectivo, 0)            AS TotalVentas,
    ISNULL(a.TotalAbastecimientos, 0)     AS TotalAbastecimientos,
    ISNULL(g.TotalGastos, 0)              AS TotalGastos,
    ISNULL(i.TotalIngresos, 0)            AS TotalIngresos,
    ISNULL(v.TotalEfectivo, 0)
        - ISNULL(a.TotalAbastecimientos, 0)
        - ISNULL(g.TotalGastos, 0)
        + ISNULL(i.TotalIngresos, 0)      AS TotalAEntregar
FROM Bitacoras b
LEFT JOIN (
    SELECT ve.idVehiculo, CAST(p.FechaHora AS DATE) AS Fecha, SUM(p.Importe) AS TotalEfectivo
    FROM Pagos p
    INNER JOIN Ventas ve ON ve.idVenta = p.idVenta
    WHERE p.TipoPago = 'Efectivo' AND ve.Estado = 'Confirmada'
    GROUP BY ve.idVehiculo, CAST(p.FechaHora AS DATE)
) v ON v.idVehiculo = b.idVehiculo AND v.Fecha = b.Fecha
LEFT JOIN (
    SELECT idVehiculo, CAST(FechaHora AS DATE) AS Fecha, SUM(Importe) AS TotalAbastecimientos
    FROM Abastecimientos GROUP BY idVehiculo, CAST(FechaHora AS DATE)
) a ON a.idVehiculo = b.idVehiculo AND a.Fecha = b.Fecha
LEFT JOIN (
    SELECT idBitacora, SUM(Importe) AS TotalGastos
    FROM MovimientosExtra WHERE Tipo = 'Gasto' GROUP BY idBitacora
) g ON g.idBitacora = b.idBitacora
LEFT JOIN (
    SELECT idBitacora, SUM(Importe) AS TotalIngresos
    FROM MovimientosExtra WHERE Tipo = 'Ingreso' GROUP BY idBitacora
) i ON i.idBitacora = b.idBitacora;
GO
