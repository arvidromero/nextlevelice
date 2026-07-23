# NextLevelIce - Frontend Chofer

App mobile-first (PWA) para la operación diaria del chofer: checklist matutino,
ventas, traspasos, gastos, y cierre de día.

## Pasos para arrancar

1. Desde la raíz del monorepo (si no lo has hecho tras este cambio):
   ```
   npm install
   ```

2. Configura la URL del backend:
   ```
   copy frontend-chofer\.env.example frontend-chofer\.env
   ```

3. Levanta el backend (si no está corriendo):
   ```
   npm run dev:backend
   ```

4. Levanta la app de chofer (en otra ventana):
   ```
   npm run dev:chofer
   ```
   Debería abrir en `http://localhost:5174`.

## Cómo probarla

1. Necesitas un usuario con rol **Operador** y un **PIN** asignado (ya hicimos esto
   con Samuel en el backend). Entra con su correo y PIN.
2. Llena el checklist matutino (elige el vehículo, odómetro, niveles de líquidos).
3. Con el usuario **Admin**, aprueba la bitácora desde `PUT /api/bitacoras/:id/aprobar`
   (por ahora vía curl/Postman -- todavía no hay pantalla de aprobación en la app de
   Operación, es un pendiente).
4. De vuelta en la app de chofer, dale "Actualizar estado" en Inicio -- deberías
   pasar a "En operación" y ver el menú inferior completo.
5. Prueba Vender, Traspaso, Gastos, y Cierre.

## Sobre el GPS

La app manda la ubicación cada 2 minutos mientras la bitácora esté "En operación",
usando la geolocalización del navegador. La primera vez, el navegador va a pedir
permiso de ubicación -- acéptalo.

## Sobre el ticket / impresión

Por ahora, al cobrar una venta se muestra un resumen en pantalla (folio, líneas,
total). La impresión térmica Bluetooth y/o el PDF compartible se agregan en la
siguiente fase.

## Pendiente conocido

Falta agregar en la app de **Operación** un botón para que el Admin apruebe
bitácoras (`PATCH /api/bitacoras/:id/aprobar`) sin tener que usar curl.
