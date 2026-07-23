/* =========================================================
   NEXTLEVELICE - Fase 0 / Bloque E: Autenticacion
   Admin/Operador que no son chofer -> correo + contraseña
   Chofer (Operador con vehiculo asignado) -> correo + PIN
   Requiere haber corrido 01_BloqueA antes.
   ========================================================= */

USE NextLevelIce;
GO

ALTER TABLE Usuarios ADD
    PasswordHash    VARCHAR(255)    NULL,   -- hash bcrypt, solo Admin
    PIN             CHAR(4)         NULL;    -- solo choferes (Operador)
GO

-- Un PIN no se puede repetir entre choferes activos
CREATE UNIQUE INDEX UX_Usuarios_PIN
    ON Usuarios(PIN)
    WHERE PIN IS NOT NULL;
GO
