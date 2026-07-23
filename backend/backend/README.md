# NextLevelIce - Backend

## Pasos para arrancar

1. **Instalar dependencias** (desde la raíz del monorepo):
   ```
   npm install
   ```

2. **Correr la migración de autenticación** en tu SQL Server (agrega PasswordHash y PIN a Usuarios):
   ```
   sqlcmd -S TU_SERVIDOR -d NextLevelIce -i ../05_BloqueE_Autenticacion.sql
   ```
   (o ábrelo y ejecútalo desde SQL Server Management Studio / Azure Data Studio)

3. **Configurar variables de entorno**:
   ```
   cp backend/.env.example backend/.env
   ```
   Edita `backend/.env` con los datos reales de tu servidor SQL Server.

4. **Generar el cliente de Prisma**:
   ```
   npm run prisma:generate --workspace=backend
   ```

5. **Levantar el servidor en modo desarrollo**:
   ```
   npm run dev:backend
   ```
   Debería quedar corriendo en `http://localhost:4000`.

## Crear tu primer usuario Admin (temporal, hasta que exista pantalla de gestión)

Como todavía no hay endpoint para crear usuarios con contraseña, corre esto una vez desde
una consola de Node dentro de `backend/`:

```js
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');

(async () => {
  const hash = await bcrypt.hash('TU_PASSWORD_TEMPORAL', 10);
  await prisma.usuario.update({
    where: { email: 'arvidromero@gmail.com' },
    data: { passwordHash: hash },
  });
  console.log('Password asignado');
})();
```

Para un chofer, en vez de `passwordHash` le asignas `pin: '1234'` (4 dígitos).

## Endpoints disponibles hasta ahora

**Autenticación**
- `POST /api/auth/login-admin` — `{ email, password }`
- `POST /api/auth/login-chofer` — `{ email, pin }`

**Productos**
- `GET /api/productos` · `GET /api/productos/:id` (cualquier usuario autenticado)
- `POST /api/productos` · `PUT /api/productos/:id` · `DELETE /api/productos/:id` (solo Admin)

**Clientes**
- `GET /api/clientes` · `GET /api/clientes/:id` (cualquier usuario autenticado)
- `POST /api/clientes` · `PUT /api/clientes/:id` · `DELETE /api/clientes/:id` (solo Admin)
- `GET /api/clientes/:idCliente/contactos` · `POST /api/clientes/:idCliente/contactos`
- `GET /api/clientes/:idCliente/refrigeradores` · `POST /api/clientes/:idCliente/refrigeradores`
- `PUT /api/clientes/contactos/:id` · `DELETE /api/clientes/contactos/:id`
- `PUT /api/clientes/refrigeradores/:id` · `DELETE /api/clientes/refrigeradores/:id`

**Vehículos**
- `GET /api/vehiculos` · `GET /api/vehiculos/:id` (cualquier usuario autenticado)
- `POST /api/vehiculos` · `PUT /api/vehiculos/:id` · `DELETE /api/vehiculos/:id` (solo Admin)

**Ubicaciones**
- `GET /api/ubicaciones` · `GET /api/ubicaciones/:id` (cualquier usuario autenticado)
- `POST /api/ubicaciones` · `PUT /api/ubicaciones/:id` · `DELETE /api/ubicaciones/:id` (solo Admin)

**Inventario / Kardex**
- `GET /api/inventario/conceptos` — catálogo de tipos de movimiento
- `GET /api/inventario/existencias?idUbicacion=VH001&idProducto=NLC5K` — saldo actual (ambos filtros opcionales)
- `GET /api/inventario/kardex?idUbicacion=VH001&idProducto=NLC5K` — últimos 100 movimientos
- `POST /api/inventario/movimientos` — movimiento suelto: `{ idUbicacion, idProducto, cantidad, idConcepto, idMaquina?, referencia?, notas? }`
  Usar para: `PRO` (producción), `MRM` (merma), `DEV` (devolución), `APO`/`ANE` (ajuste de inventario físico)
- `POST /api/inventario/traspasos` — movimiento ligado (salida + entrada): `{ idUbicacionOrigen, idUbicacionDestino, idProducto, cantidad, idConceptoSalida?, idConceptoEntrada?, notas? }`
  Por default usa `TOU`/`TIN` (traspaso entre camionetas). Para retorno a cámara al cierre de día, pasa `idConceptoSalida: 'RET'` e `idConceptoEntrada: 'APO'`

**Ventas**
- `GET /api/ventas?idVehiculo=VH001` — últimas 100 ventas (cualquier usuario autenticado)
- `GET /api/ventas/:id` — encabezado + detalle + pagos
- `POST /api/ventas` — registrar venta (cualquier usuario autenticado, el chofer vende):
  ```json
  { "idCliente": "C00001", "idVehiculo": "VH001", "latitud": 19.4, "longitud": -99.2,
    "detalle": [{ "idProducto": "NLC5K", "cantidad": 6 }],
    "pago": { "importe": 125, "tipoPago": "Efectivo" } }
  ```
  Si el cliente tiene una promoción activa para ese producto, se calcula el split
  automáticamente (línea cobrada + línea bonificada) y el Kardex se descuenta por el total.
- `POST /api/ventas/:id/cancelar` — solo Admin, body: `{ "motivo": "..." }`. Revierte el Kardex automáticamente.

**Promociones**
- `GET /api/promociones?idCliente=C00001` — cualquier usuario autenticado
- `POST /api/promociones` — solo Admin: `{ idCliente, idProducto, cantidadCompra, cantidadBonificada, fechaVencimiento }`
- `DELETE /api/promociones/:id` — solo Admin (desactiva)

## IMPORTANTE: corre la migración del Bloque G

Antes de probar ventas, corre `07_BloqueG_AjustesVentas.sql` en tu SQL Server
(agrega el concepto CAN y reescribe sp_GenerarFolioVenta sin OUTPUT param).

Antes de probar inventario, corre `06_BloqueF_AjusteProcedimientoKardex.sql` en tu SQL Server
(actualiza el procedimiento para que regrese el KardexID generado).

Cada vez que agreguemos modelos nuevos al `schema.prisma`, corre de nuevo:
```
npm run prisma:generate --workspace=backend
```
Y reinicia el servidor (`Ctrl+C` y otra vez `npm run dev:backend`).

## Patrón para agregar el resto de catálogos

Cada catálogo nuevo (Clientes, Vehículos, Ubicaciones, Contactos, Refrigeradores) sigue
exactamente el mismo patrón de 3 pasos que ves en Productos:
1. Agregar el modelo correspondiente en `prisma/schema.prisma`
2. Crear `src/controllers/<catalogo>Controller.js`
3. Crear `src/routes/<catalogo>Routes.js` y registrarla en `server.js`
