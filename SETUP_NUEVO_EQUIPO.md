# NextLevelIce — Primer uso en un equipo nuevo

Esta guía es para cuando trabajas el proyecto desde un equipo distinto (ej. oficina)
al que ya tienes configurado en casa. Solo se hace **una vez** por equipo.

---

## 1. Instalar lo básico

### Node.js
1. Ve a https://nodejs.org
2. Descarga la versión **LTS**
3. Instálala (siguiente, siguiente, siguiente)
4. Verifica en cmd:
   ```
   node -v
   ```
   Debe mostrar algo como `v20.x.x` o `v22.x.x`

### Git
1. Ve a https://git-scm.com/download/win
2. Instálalo (en la pantalla del editor default, elige "Use Notepad as Git's default editor" si no conoces Vim)
3. Verifica:
   ```
   git --version
   ```
4. Configura tu identidad (una sola vez por equipo):
   ```
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```

### Si usas PowerShell y te marca error de "ejecución de scripts deshabilitada"
Usa **cmd** en vez de PowerShell, o corre esto en PowerShell como Administrador:
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## 2. Clonar el proyecto

Elige una carpeta donde quieras trabajar (ej. `C:\Proyectos`) y corre:

```
cd C:\Proyectos
git clone https://github.com/arvidromero/nextlevelice.git
cd nextlevelice
```

---

## 3. Instalar dependencias

Desde la raíz del proyecto (`nextlevelice`), un solo comando instala las 3 apps
(backend, frontend, frontend-chofer) porque son workspaces de un mismo monorepo:

```
npm install
```

Puede tardar 1-2 minutos.

---

## 4. Configurar las variables de entorno

**Importante:** los archivos `.env` con contraseñas **nunca se suben a GitHub**
por seguridad. Hay que recrearlos a mano en cada equipo nuevo.

```
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
copy frontend-chofer\.env.example frontend-chofer\.env
```

Abre `backend\.env` con Notepad y llena con los datos reales de tu SQL Server
(los mismos que ya usas en el equipo de casa):

```
DATABASE_URL="sqlserver://TU_IP_PUBLICA:1433;database=NextLevelIce;user=TU_USUARIO;password=TU_PASSWORD;trustServerCertificate=true"
JWT_SECRET="escribe-aqui-cualquier-texto-largo-y-random"
PORT=4000
```

Los archivos `frontend\.env` y `frontend-chofer\.env` normalmente no necesitan
cambios (ya apuntan a `http://localhost:4000/api`).

---

## 5. Generar el cliente de Prisma

Esto le "enseña" al código cómo hablar con las tablas de tu base de datos real:

```
npm run prisma:generate --workspace=backend
```

Si te marca error de que `prisma` no se reconoce, usa:
```
cd backend
npx prisma generate
cd ..
```

---

## 6. Levantar las 3 apps

Necesitas **3 ventanas de cmd** abiertas, todas en la carpeta raíz del proyecto
(`nextlevelice`), cada una corriendo un comando distinto:

**Ventana 1 — Backend:**
```
npm run dev:backend
```
Debe decir: `API corriendo en http://localhost:4000`

**Ventana 2 — App de Operación:**
```
npm run dev:frontend
```
Debe decir: `Local: http://localhost:5173/`

**Ventana 3 — App de Chofer:**
```
npm run dev:chofer
```
Debe decir: `Local: http://localhost:5174/`

---

## 7. Confirmar que todo funciona

- Abre `http://localhost:4000/api/health` en el navegador → debe decir `{"status":"ok"}`
- Abre `http://localhost:5173` → debe cargar el login de Operación
- Abre `http://localhost:5174` → debe cargar el login de Chofer

Entra con tus mismos usuarios de siempre (Admin con correo+contraseña, chofer con
correo+PIN) — son los mismos porque la base de datos es la misma para ambos equipos.

---

## 8. Rutina de aquí en adelante (en cualquiera de los 2 equipos)

**Al EMPEZAR a trabajar:**
```
git pull
```
(por si dejaste cambios subidos desde el otro equipo)

**Al TERMINAR de trabajar:**
```
git add .
git commit -m "Descripcion breve de lo que hiciste"
git push
```

**Regla de oro:** siempre `pull` antes de empezar, siempre `push` antes de cerrar.
Si algún día se te olvida y haces cambios en los 2 equipos sin sincronizar, Git
puede marcar un conflicto — es normal, y en ese caso me dices y lo resolvemos juntos.

---

## Problemas comunes

| Error | Solución |
|---|---|
| `npm : no se puede cargar... ejecución de scripts deshabilitada` | Usa cmd en vez de PowerShell, o corre el `Set-ExecutionPolicy` de arriba |
| `prisma no se reconoce como un comando` | Usa `npx prisma generate` en vez del script |
| `vite no se reconoce como un comando` | Corre `npm install` otra vez desde la raíz |
| Error de conexión a SQL Server | Revisa que `DATABASE_URL` en `backend\.env` tenga la IP, usuario y password correctos |
