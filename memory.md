# 🧠 Memoria del proyecto — multi-store

> Este archivo se **sobrescribe** al final de cada feature, cambio o sesión de trabajo.
> Refleja el estado actual y las últimas novedades. El historial completo está en `git log`.

**Última actualización:** 2026-10-05
**Último commit:** `8173b2a` chore: licencia propietaria (rama `main`, sincronizada con `origin/main`)

---

## 🎯 Objetivo del proyecto

Base para una **tienda con control de stock y punto de venta (POS)**.
Hoy es un inventario multiusuario (grupos, ubicaciones, etiquetas, items) que sirve de punto de partida.

---

## 📦 Estado actual

### Repositorio
- GitHub (privado): https://github.com/xtianmarucco/multi-store — rama `main`
- Autor de commits: `Christian Marucco Gonzalez <christian.marucco@gmail.com>` (configurado solo en este repo)
- Licencia: **propietaria** (`LICENSE`, `"license": "UNLICENSED"` en ambos `package.json`)

### Stack
- **Back** (`back-multi-store/`): Node (CommonJS) + Express 5 + Prisma 7 (`@prisma/adapter-pg`) + PostgreSQL,
  sesiones con express-session + connect-pg-simple, bcrypt. Capas routes → controllers → services → repositories.
- **Front** (`front-multi-store/`): Vue 3 (JS) + Tailwind v4 + Pinia + Axios (`services/apiClient.js`) + lucide-static.
- **DB**: PostgreSQL 16 en Docker (`docker/docker-compose.yml`).
- Arquitectura y convenciones copiadas de **stock-control-vue** (repo propio del usuario). Reglas en `docs/`.

### Puertos locales
| Servicio | Puerto |
|---|---|
| PostgreSQL | 5434 |
| API | 3200 |
| Web | 5175 |

Login demo: `demo@example.com` / `demo12345`

### Modelo de datos (`back-multi-store/prisma/schema.prisma`)
- `groups` — tenant; todo dato pertenece a un grupo (`group_id` siempre desde la sesión)
- `users` — `role`: `admin` | `member`; siempre al menos un admin por grupo
- `locations` — jerárquicas con `parent_id`, sin ciclos; al borrar quedan hijos/items sin ubicación
- `labels` — nombre único por grupo, color `#rrggbb`, N:M con items
- `items` — cantidad, marca, modelo, serie, precio/fecha de compra, garantía, notas, `is_archived`

### Funcionalidades
- Auth: registro (crea grupo + admin), login, logout, `me`
- Dashboard: totales de items, ubicaciones, etiquetas y valor (Σ precio × cantidad)
- Items: listado con búsqueda, filtros (ubicación, etiqueta, archivados) y paginación; alta/edición/baja
- Ubicaciones (árbol), etiquetas y usuarios (solo admin): CRUD

### Tests
- Back: 25 tests (services con repositories mockeados) → `cd back-multi-store && npm test`
- Front: 17 tests (stores y utils) → `cd front-multi-store && npm test`

---

## 🆕 Última sesión (2026-10-05)

- Se exploró **HomeBox** (Go + Nuxt, AGPL-3.0) como referencia y se levantó en Docker (`homebox-local`, puerto 3100).
- Se decidió usarlo **solo como inspiración**: multi-store se escribió desde cero, sin código de HomeBox.
- Primera versión armada como monorepo TypeScript; se **descartó** y se rehízo siguiendo stock-control-vue.
- Backend + frontend completos, verificados con curl y con un recorrido E2E en navegador headless.
- Bugs corregidos durante la sesión:
  - Búsqueda de items: el filtro pendiente (debounce) se perdía al salir de la vista.
  - Íconos: las clases `i-lucide-*` (heredadas de stock-control) no existen; se usan `icon-*`.
- Repo creado en GitHub (privado) y publicado en `main`.
- Licencia propietaria agregada; auditoría de dependencias: todas permisivas (MIT/Apache/ISC/BSD).
- Se creó este `memory.md` y la regla en `CLAUDE.md` para mantenerlo actualizado en cada sesión.

---

## ⚠️ Decisiones y reglas a recordar

- **Nunca copiar código de HomeBox** (AGPL-3.0); solo referencia funcional.
- `group_id` siempre desde `req.session`, nunca del body ni de query params.
- `prisma migrate reset` está bloqueado cuando se ejecuta desde Claude Code: lo corre el usuario.
- npm 11 bloquea scripts de postinstall (aviso `allow-scripts`); Prisma y bcrypt funcionan igual.

## 🐞 Pendientes / conocidos

- La DB de desarrollo tiene datos de prueba extra (items "Bicicleta"/"Sierra", usuarios `otro@example.com`
  y `m@example.com`). Limpiar con `npx prisma migrate reset` en `back-multi-store`.
- En **stock-control-vue**: el `.env` está commiteado en un repo público (rotar `SESSION_SECRET` y la
  contraseña de la DB) y los íconos usan `i-lucide-*` (no renderizan).

## 🚀 Próximos pasos sugeridos

- Definir el dominio de tienda/POS: productos con precio de venta y SKU/código de barras,
  stock por sucursal, movimientos de stock, ventas (carrito, medios de pago, comprobante).
- Decidir si `locations` evoluciona a sucursales/depósitos o se agrega un modelo `branches`.
