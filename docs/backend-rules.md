# 🧱 Backend Architecture Rules

Usamos arquitectura en capas:

- controllers  → manejan HTTP requests/responses
- services     → contienen la lógica de negocio
- repositories → interactúan con la base de datos via Prisma

---

# ⚠️ Reglas Críticas

- NUNCA poner lógica de negocio dentro de los controllers
- Los controllers deben ser delgados (thin controllers)
- Los services contienen toda la lógica de negocio
- Los repositories solo manejan queries a la base de datos

---

# 🗄️ Base de datos — Prisma es el único ORM

- **TODO** acceso a datos va a través de Prisma (`src/lib/prisma.js`)
- Nunca usar `pg` directamente para queries de la aplicación
- `pg` solo se usa para `connect-pg-simple` (session store)
- La única variable de conexión es `DATABASE_URL`
- El schema vive en `back-multi-store/prisma/schema.prisma` — ese archivo es la fuente de verdad
- Después de cualquier cambio de schema: `prisma migrate dev` (dev) o `prisma migrate deploy` (prod)

---

# 📁 Estructura de Carpetas

src/
  controllers/
  services/
  repositories/
  routes/
  middleware/
  lib/          → prisma.js vive aquí
  utils/

---

# 🔐 Autenticación

- Usar express-session para autenticación
- Las sesiones se almacenan en PostgreSQL via `connect-pg-simple` (tabla: `session`)
- `SESSION_SECRET` debe ser variable de entorno; la app debe fallar al iniciar si no está en producción
- Guardar `userId` en la sesión
- Usar middleware para proteger rutas

---

# 🏠 Grupos (multi-tenant)

Todo dato de negocio (ubicaciones, etiquetas, items, usuarios) pertenece a un grupo:

- El `group_id` sale SIEMPRE de la sesión (`req.session.groupId`), nunca del body ni de query params
- Los controllers pasan `req.session.groupId` como primer argumento a los services
- Los repositories filtran SIEMPRE por `group_id` (`findFirst({ where: { id, group_id } })`, no `findUnique({ where: { id } })`)
- Antes de vincular una referencia (`location_id`, `parent_id`, `label_ids`) el service verifica que pertenezca al grupo
- Un recurso de otro grupo se trata como inexistente (`NOT_FOUND` / `VALIDATION_ERROR`), nunca `FORBIDDEN`

---

# 🌳 Ubicaciones jerárquicas

- `locations.parent_id` arma el árbol (Casa > Garaje > Estantería)
- Al actualizar, el service impide ciclos: el nuevo padre no puede ser la ubicación ni un descendiente
- Al borrar, sububicaciones e items quedan sin ubicación (`onDelete: SetNull`)

---

# 📦 Convenciones de Capas

## Controller (delgado)

```js
const createItem = async (req, res) => {
  try {
    const data = await itemsService.create(req.session.groupId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}
```

## Service (lógica de negocio)

```js
const create = async (groupId, payload) => {
  const data = await buildData(groupId, payload) // valida y normaliza
  return itemsRepository.create({ ...data, group_id: groupId })
}
```

## Repository (solo DB)

```js
const findById = (groupId, id) =>
  prisma.items.findFirst({ where: { id, group_id: groupId }, include })
```

---

# 🛡️ Validación

- Siempre validar el input en el service (no en el controller)
- Lanzar errores con código semántico:

```js
throw createError('La ubicación no existe', 'VALIDATION_ERROR', 400)
```

- Usar `createError` y el `handleError` centralizado de `utils/handleError.js`
- Helpers de parseo/normalización en `utils/parse.js` (`parseId`, `requiredText`, `optionalDate`, …)

---

# 🌐 Variables de Entorno

Requeridas:

DATABASE_URL=postgresql://multistore:multistore@localhost:5434/multistore
SESSION_SECRET=secret_muy_largo_y_seguro   # la app no arranca sin él
PORT=3200
CORS_ORIGIN=http://localhost:5175

Nunca usar las variables individuales DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
con Prisma — solo DATABASE_URL.

---

# 🧪 Tests

- Vitest en `src/__tests__/*.service.test.js`
- Se testean los services mockeando los repositories con `vi.spyOn`

---

# 🚫 Qué Evitar

- NO poner lógica de negocio en controllers
- NO hacer queries directas en controllers o services (solo en repositories)
- NO exponer mensajes de error internos de Prisma al cliente
- NO saltear validaciones "porque el frontend ya valida"
- NO leer `group_id` del request: siempre de la sesión
