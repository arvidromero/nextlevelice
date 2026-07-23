/* =========================================================
   NEXTLEVELICE - Fase 0 / Bloque F: Ajuste al procedimiento
   de Kardex para poder ligar traspasos desde el backend.
   Ahora el KardexID se genera explicito y se regresa como
   resultado, en vez de depender del DEFAULT NEWID() de la
   columna (que antes era invisible para el backend).
   ========================================================= */

USE NextLevelIce;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarMovimientoKardex
    @idUbicacion        VARCHAR(10),
    @idProducto         VARCHAR(10),
    @Cantidad           INT,
    @idConcepto         VARCHAR(5),
    @Usuario            VARCHAR(100),
    @idMaquina          NVARCHAR(50) = NULL,
    @Ubicacion_Destino  VARCHAR(10) = NULL,
    @Referencia         NVARCHAR(50) = NULL,
    @Notas              NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Factor SMALLINT;
    DECLARE @Operacion VARCHAR(10);
    DECLARE @NuevoKardexID VARCHAR(36) = CONVERT(VARCHAR(36), NEWID());

    SELECT @Factor = Factor FROM Conceptos WHERE idConcepto = @idConcepto;
    IF @Factor IS NULL
    BEGIN
        RAISERROR('Concepto no valido', 16, 1);
        RETURN;
    END

    SET @Operacion = CASE WHEN @Factor = 1 THEN 'Entrada' ELSE 'Salida' END;

    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM Ubicaciones_Existencias WHERE idUbicacion = @idUbicacion AND idProducto = @idProducto)
        INSERT INTO Ubicaciones_Existencias (idUbicacion, idProducto, Saldo)
        VALUES (@idUbicacion, @idProducto, 0);

    INSERT INTO Kardex (KardexID, idUbicacion, idProducto, Cantidad, idConcepto, idMaquina, Operacion, Ubicacion_Destino, Referencia, Usuario, Notas)
    VALUES (@NuevoKardexID, @idUbicacion, @idProducto, @Cantidad, @idConcepto, @idMaquina, @Operacion, @Ubicacion_Destino, @Referencia, @Usuario, @Notas);

    UPDATE Ubicaciones_Existencias
    SET Saldo = Saldo + (@Factor * @Cantidad),
        FechaActualizacion = SYSDATETIME()
    WHERE idUbicacion = @idUbicacion AND idProducto = @idProducto;

    COMMIT TRANSACTION;

    SELECT @NuevoKardexID AS KardexID;
END;
GO
