# 🧠 Memoria del proyecto — multi-store

> Este archivo se **sobrescribe** al final de cada feature, cambio o sesión de trabajo.
> Refleja el estado actual y las últimas novedades. El historial completo está en `git log`.

**Última actualización:** 2026-10-10
**Último commit:** `51647fe` feat(front): agregar vista de stock por sucursal y capital en dashboard (rama `feat/product-catalog-pos`)

---

## 🎯 Objetivo del proyecto

Base para una **tienda con control de stock y punto de venta (POS)**.
Catálogo vendible (productos/categorías con opt-in por producto), stock por depósito/local
y capital valorizado por tipo de ubicación. `items` queda como legacy solo-lectura.

---

## 📦 Estado actual

### Repositorio
- GitHub (privado): https://github.com/xtianmarucco/multi-store — rama `feat/product-catalog-pos`
- Autor de commits: `Christian Marucco Gonzalez <christian.marucco@gmail.com>` (configurado solo en este repo)
- Licencia: **propietaria** (`LICENSE`, `"license": "UNLICENSED"` en ambos `package.json`)
- Catálogo POS Fase 1 completo en la rama (T1–T9); T10 (docs + verificación) en curso.

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
- `locations` — jerárquicas con `parent_id`, sin ciclos; + `type` (warehouse|store|other),
  `address`, `is_sale_point`; filtro `?type=`; al borrar quedan hijos/items sin ubicación
- `labels` — nombre único por grupo, color `#rrggbb`, N:M con items y con productos
- `items` — legacy solo-lectura: GETs + DELETE; POST/PUT → 410 GONE (código GONE)
- `categories` — nombre único por grupo, color `#rrggbb`, `parent_id` sin ciclos,
  lista plana con `product_count`, detalle con parent/children
- `products` — `sku` único por grupo, `barcode?`, `name`, `brand?`, `unit` (unit|weight|pack),
  `cost_price?`, `sale_price?`, `tax_rate?`, `min_stock` (default 0), `active` (default true),
  `category_id?`, N:M con labels; listado con search/category_id/label_id/active + paginación
- `product_variants` — anidadas por producto: `sku` único por grupo, `barcode?`, `attributes?` (objeto),
  `cost_price?`, `sale_price?`, `min_stock`, `active`; mismatch producto/variante → 404
- `price_lists` + `product_prices` — listas por grupo (nombre único), filas por producto (+variante opcional);
  precio efectivo: fila de lista → sale de variante → sale de producto
- `stocks` — cantidad por (grupo, producto, variante?, ubicación); granularidad: producto con
  variantes exige movimientos por variante
- `stock_movements` — historial `in|out|adjust|transfer` con usuario y nota; paginado

### Funcionalidades
- Auth: registro (crea grupo + admin), login, logout, `me`
- Dashboard: totales legacy (items/ubicaciones/etiquetas/valor) + `total_products` (solo active),
  `total_categories`, `capital_total` / `capital_warehouse` / `capital_store` (valorizado a COSTO),
  `low_stock_count`; front con capital por tipo y stock bajo por sucursal
- Productos/categorías: CRUD + búsqueda/filtros; alta en dos pasos (toggles default off:
  variantes y mayorista solo por opt-in)
- Stock por sucursal (StocksView: adjust/transfer/in/out) + historial de movimientos
- Script `migrate-items-to-products.js` (items→products, dry-run 8 items) + seed comercio
  (Depósito Central, Local Centro)
- Ubicaciones tipificadas (type/address/is_sale_point)

### Tests
- Back: 128 tests (vitest, services + controlador items) → `cd back-multi-store && npm test`
- Front: 33 tests (stores y utils) → `cd front-multi-store && npm test`
- Excepción test-first: los docs en prosa (T10, `docs/api-contract.md` + `memory.md`) no llevan
  ciclo RED; la verificación es el check de la sección siguiente.

---

## 🆕 Última sesión (2026-10-10) — Catálogo POS Fase 1 (T1–T10)

- T1 Prisma: schema, migración, script items→products, seed comercio (`5a5a696`).
- T2 locations tipificadas (`c33ff97`); T3 categories CRUD (`77850c6`).
- T4 products CRUD + búsqueda/filtros (`c9595ce`); T5 variantes + listas de precio + resolvePrice (`b0bcfaf`).
- T6 stocks + movimientos + dashboard capital (`9c2a71a` + fix `5ce6dbd`).
- T7 items solo-lectura POST/PUT → 410 (`c4bbb81`).
- T8 front categorías + productos, alta en dos pasos (`35af679`).
- T9 front stock por sucursal + dashboard capital (`51647fe`).
- T10 docs (`docs/api-contract.md`: Products, Categories, Variants, Price Lists, Stocks,
  Stock Movements, Locations, Dashboard, Items 410 + código GONE/410; este `memory.md`)
  + verificación full: `npm test` back, `npm test` front, `npm run build` front,
  `npx prisma validate` + `npx prisma migrate status` en back.

---

## ⚠️ Decisiones y reglas a recordar

- **Nunca copiar código de HomeBox** (AGPL-3.0); solo referencia funcional.
- `group_id` siempre desde `req.session`, nunca del body ni de query params.
- `prisma migrate reset` está bloqueado cuando se ejecuta desde Claude Code: lo corre el usuario.
- npm 11 bloquea scripts de postinstall (aviso `allow-scripts`); Prisma y bcrypt funcionan igual.
- **Reemplazo** (no convivencia permanente): `items` es legacy, el catálogo vive en `products`.
- **Tipificación** de `locations`: `type` warehouse|store|other + `address` + `is_sale_point`.
- **Toggles default off**: variantes y mayorista apagados en el alta salvo opt-in.
- **Capital a costo**: capital = Σ(stock × costo), nunca precio de venta.
- Commits convencionales, sin "Co-Authored-By" ni atribución a IA.

## 🐞 Pendientes / conocidos (follow-ups de revisión, advisory)

- Migración sin transacción: fallo a mitad de corrida deja estado parcial (migrate-items-to-products.js:71-119).
- findFirst-then-create en stocks: ventana de race en reintentos (mismo archivo:99-117).
- Items sin ubicación destino se saltean con exit 0 (mismo archivo:73-77).
- Seed sin transacción + guard solo por demo user deja half-seed permanente (seed.js:57-79).
- Locations ?type= sin allowlist llega a Prisma en vez de 400 (locations.controller.js:7).
- Cycle guard de categorías sin cota ni visited set: un ciclo corrupto colgaría el request (categories.service.js:48-54).
- parsePrice acepta null/''/false como precio 0 en filas de precio (price-lists.service.js:7-12).
- resolvePrice no verifica variant.product_id contra el producto pedido (price-lists.service.js:87-90).
- `active` con `=== true` convierte 1/"true" en false silencioso (variants.service.js:42).
- transfer lanza TypeError (no VALIDATION_ERROR) si la fila origen no existe — preexistente, fuera de alcance T6.
- Limitación conocida: sin row-locking, escritores concurrentes finos pueden lost-update (aceptado para MVP single-instancia).
- categoryTree sin visited set: ciclo colgaría el front + huérfanos invisibles; el picker de padre solo excluye self (CategoriesView:141, categoryTree.js:11).
- ProductsView: filtros/paginador sin catch → rejection sin toast (vs. search con load()).
- ProductFormView: wholesale asume name string + precio vacío sin validar (:423); mount en edit redirige aunque falle solo fetch auxiliar (:472).
- StocksView: transfer sin destino → id 0 llega a la API; adjust/transfer sin validar cantidad en UI (depende del server).
- stocksStore: paginación muta antes del fetch, fallo deja vista stale.

## 🚀 Próximos pasos

1. **Merge a `main`** de la rama `feat/product-catalog-pos` (lo decide el usuario; push/PR los decide el usuario).
2. **Fase 3: roles seller + ventas online/local** (fuera del alcance de este feature):
   carrito, medios de pago, comprobante; rol seller; mayorista UI avanzada.
