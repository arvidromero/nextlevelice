# NextLevelIce - Frontend (Operación)

Esta es la app web para Admin: login y catálogos. Corre en paralelo al backend.

## Pasos para arrancar

1. **Instalar dependencias** (si ya corriste `npm install` en la raíz del monorepo, esto ya
   se hizo junto con el backend -- npm workspaces instala todo de un jalón):
   ```
   npm install
   ```

2. **Configurar la URL del backend**:
   ```
   copy frontend\.env.example frontend\.env
   ```
   Por default apunta a `http://localhost:4000/api` (donde corre tu backend local).

3. **Levantar el backend** en una ventana de terminal (si no lo tienes corriendo):
   ```
   npm run dev:backend
   ```

4. **Levantar el frontend** en otra ventana:
   ```
   npm run dev:frontend
   ```
   Deberia abrir en `http://localhost:5173`.

5. Entra con tu correo y contraseña de Admin (el mismo que usaste para probar la API
   con curl).

## Que hay hasta ahora

- Pantalla de login (solo Admin, correo + contraseña)
- Catalogo de Productos: listar, crear, desactivar
- Sesion persistente (el token se guarda en el navegador, no se pide login cada vez
  que recargas la pagina)

## Patron para agregar mas pantallas de catalogos

Cada pantalla nueva (Clientes, Vehiculos, Ubicaciones) sigue el mismo patron que
`src/pages/Productos.jsx`:
1. Crear `src/pages/<Catalogo>.jsx` copiando la estructura de Productos.jsx
2. Ajustar los campos del formulario y las llamadas a `/api/<catalogo>`
3. Agregar la ruta en `src/App.jsx`
