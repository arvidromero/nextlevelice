/* =========================================================
   NEXTLEVELICE - Fase 0 / Bloque G: Ajustes para Ventas
   ========================================================= */

USE NextLevelIce;
GO

-- Nuevo concepto: reversion de Kardex cuando se cancela una venta
-- (Entrada, regresa el producto a la camioneta de origen)
IF NOT EXISTS (SELECT 1 FROM Conceptos WHERE idConcepto = 'CAN')
    INSERT INTO Conceptos (idConcepto, Factor, Concepto, Mostrar)
    VALUES ('CAN', 1, 'Entrada por cancelacion de venta', 0);
GO

-- Reescribimos sp_GenerarFolioVenta sin OUTPUT param -- el backend
-- lo lee mas facil como un SELECT normal, igual que hicimos con Kardex.
DROP PROCEDURE IF EXISTS sp_GenerarFolioVenta;
GO

CREATE PROCEDURE sp_GenerarFolioVenta
    @Fecha DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Anio VARCHAR(2) = RIGHT(CAST(YEAR(@Fecha) AS VARCHAR(4)), 2);
    DECLARE @MesAbrev VARCHAR(3) = CASE MONTH(@Fecha)
        WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
        WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
        WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
        WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
    END;
    DECLARE @Prefijo VARCHAR(10) = 'V' + @Anio + '-' + @MesAbrev;
    DECLARE @Siguiente INT;

    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM Contadores_Folio WHERE Prefijo = @Prefijo)
        INSERT INTO Contadores_Folio (Prefijo, Siguiente) VALUES (@Prefijo, 1);

    SELECT @Siguiente = Siguiente
    FROM Contadores_Folio WITH (UPDLOCK, HOLDLOCK)
    WHERE Prefijo = @Prefijo;

    UPDATE Contadores_Folio
    SET Siguiente = Siguiente + 1
    WHERE Prefijo = @Prefijo;

    COMMIT TRANSACTION;

    SELECT @Prefijo + '-' + RIGHT('00000' + CAST(@Siguiente AS VARCHAR(5)), 5) AS Folio;
END;
GO
