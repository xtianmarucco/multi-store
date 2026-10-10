# 📋 API Design Rules

Este documento define cómo debe diseñarse e implementarse la API del backend.

Todos los endpoints deben seguir estas reglas estrictamente.

---

# 🧱 Principios Generales

- Usar convenciones RESTful
- Usar JSON para todos los requests y responses
- Respuestas consistentes en todos los endpoints

---

# 🌐 Base URL

/api

---

# 📝 Nomenclatura de Recursos

- Usar sustantivos en plural
- Lowercase y hyphen-case:

  /items
  /locations
  /labels
  /maintenance-entries   (ejemplo de recurso compuesto)

---

# 📍 Estructura de Endpoints

Todo lo que no es `/auth` requiere sesión (`requireAuth`) y opera sobre el grupo del usuario.

## Auth

POST   /auth/register          → crea grupo + usuario admin e inicia sesión (body: full_name, email, password, group_name?)
POST   /auth/login             → iniciar sesión (body: email, password)
POST   /auth/logout            → cerrar sesión
GET    /auth/me                → usuario autenticado actual

## Dashboard

GET    /dashboard              → { total_items, total_locations, total_labels, total_value,
                                   total_products, total_categories,
                                   capital_total, capital_warehouse, capital_store, low_stock_count }
# capital_* valorizado a COSTO (variante si hay, si no producto):
# capital_total = Σ(stock × costo); capital_warehouse/store filtran por locations.type.
# low_stock_count = filas con quantity < min_stock (de variante si hay, si no de producto).
# total_products cuenta solo active:true; total_value/total_items siguen siendo de items legacy.

## Products (Catálogo)

GET    /products               → listado paginado (?search= ?category_id= ?label_id= ?active=true|false|all ?page= ?pageSize=)
# Respuesta: { products, total, page, pageSize } (pageSize máx. 100; active por defecto true)
GET    /products/:id           → detalle (incluye category, labels, variants, stocks)
POST   /products               → crear (body: sku*, name*, barcode?, description?, brand?,
#                                unit? unit|weight|pack (default unit), cost_price?, sale_price?,
#                                tax_rate?, min_stock? entero ≥0 (default 0), active? default true,
#                                category_id?, label_ids?[])
PUT    /products/:id           → actualizar (mismo body; reemplaza label_ids)
DELETE /products/:id           → eliminar

## Categories (Categorías)

GET    /categories             → lista plana con parent_id y product_count (el front arma el árbol)
GET    /categories/:id         → detalle con parent y children
POST   /categories             → crear (body: name*, color? #rrggbb, parent_id?)
PUT    /categories/:id         → actualizar (valida ciclos: el nuevo padre no puede ser
#                                la categoría ni uno de sus descendientes → 400 VALIDATION_ERROR)
DELETE /categories/:id         → eliminar (hijos y productos quedan sin categoría, SetNull)

## Variants (Variantes anidadas)

GET    /products/:id/variants            → listar variantes del producto
POST   /products/:id/variants            → crear (body: sku*, barcode?, attributes? objeto,
#                                          cost_price?, sale_price?, min_stock? default 0, active? default true)
PUT    /products/:id/variants/:vid       → actualizar
DELETE /products/:id/variants/:vid       → eliminar
# La variante debe pertenecer al producto de la URL: mismatch → 404 NOT_FOUND.

## Price Lists (Listas de precios)

GET    /price-lists                      → listar
GET    /price-lists/:id                  → detalle
POST   /price-lists                      → crear (body: name*)
PUT    /price-lists/:id                  → actualizar (body: name*)
DELETE /price-lists/:id                  → eliminar
GET    /price-lists/:id/prices           → filas de precio de la lista
POST   /price-lists/:id/prices           → fijar precio (body: product_id*, variant_id?, price* ≥0)
PUT    /price-lists/:id/prices/:priceId  → actualizar precio (body: price* ≥0)
DELETE /price-lists/:id/prices/:priceId  → eliminar fila
# Precio efectivo (resolvePrice, uso interno de ventas): fila de lista (producto+variante)
# → sale_price de la variante → sale_price del producto → null si no hay precio.

## Stocks (Stock por sucursal)

GET    /stocks                 → listar paginado (?product_id= ?location_id= ?page= ?pageSize=)
#                                → { stocks, total, page, pageSize }
POST   /stocks/adjust          → fijar stock absoluto (body: product_id*, variant_id?,
#                                location_id*, quantity* entero ≥0, note?)
#                                → 201 + movimiento type adjust
POST   /stocks/transfer        → mover entre sucursales (body: product_id*, variant_id?,
#                                from_location_id*, to_location_id* distintas,
#                                quantity* entero >0, note?) → 201
#                                → 400 VALIDATION_ERROR si stock insuficiente en origen
POST   /stocks/in              → entrada (body: product_id*, variant_id?, location_id*,
#                                quantity* entero >0, note?) → 201, movimiento type in
POST   /stocks/out             → salida (body: igual que in; valida suficiente) → 201, type out
# Regla de granularidad: un producto CON variantes no acepta movimientos a nivel producto
# (variant_id null → 400); con variante, variant_id debe pertenecer al producto.

## Stock Movements (Movimientos)

GET    /stock-movements        → historial paginado (?product_id= ?location_id= ?page= ?pageSize=)
#                                → { movements, total, page, pageSize }
#                                (types: in | out | adjust | transfer)

## Items (legacy, solo-lectura)

GET    /items                  → listar paginado (?search= ?location_id= ?label_id= ?archived=true ?page= ?pageSize=)
GET    /items/:id              → detalle (incluye location y labels)
POST   /items                  → 410 GONE (código GONE; mensaje "Los items están deprecated: usar /products")
PUT    /items/:id              → 410 GONE (mismo código/mensaje; no toca el servicio)
DELETE /items/:id              → eliminar (conservado para limpiar filas legacy ya migradas)

## Locations (Ubicaciones)

GET    /locations              → lista plana con parent_id e item_count (el front arma el árbol)
#                                (?type=warehouse|store|other filtra por tipo)
GET    /locations/:id          → detalle con parent y children
POST   /locations              → crear (body: name, description?, parent_id?, type? warehouse|store|other
#                                (default other), address?, is_sale_point? default false)
PUT    /locations/:id          → actualizar (valida ciclos; mismos campos)
DELETE /locations/:id          → eliminar (hijos e items quedan sin ubicación)

## Labels (Etiquetas)

GET    /labels                 → listar con item_count
GET    /labels/:id             → detalle
POST   /labels                 → crear (body: name, description?, color? #rrggbb)
PUT    /labels/:id             → actualizar
DELETE /labels/:id             → eliminar

## Users (Usuarios del grupo)

GET    /users                  → listar (requireAdmin)
POST   /users                  → crear (requireAdmin; body: full_name, email, password, role)
PUT    /users/:id              → actualizar nombre/rol/contraseña (requireAdmin)
DELETE /users/:id              → eliminar (requireAdmin; no el propio ni el último admin)

---

# 📥 Filtros con Query Params

Filtros siempre van como query params, nunca en el body:

/items?search=bosch&location_id=2&label_id=1&page=1&pageSize=20
/items?archived=true

Respuesta paginada:

{
  "success": true,
  "data": { "items": [...], "total": 45, "page": 1, "pageSize": 20 }
}

---

# 📥 Request Format

Usar JSON body para POST y PUT.

Ejemplo — POST /items:

{
  "name": "Taladro percutor",
  "quantity": 1,
  "location_id": 2,
  "label_ids": [1, 3],
  "manufacturer": "Bosch",
  "purchase_price": 89.9,
  "purchase_date": "2024-03-10"
}

---

# ✅ Response Format — SUCCESS

Todas las respuestas exitosas deben seguir esta estructura:

{
  "success": true,
  "data": ...
}

## Recurso único:

{
  "success": true,
  "data": {
    "id": 1,
    "name": "Garaje"
  }
}

## Lista:

{
  "success": true,
  "data": [
    { "id": 1, "name": "Casa" },
    { "id": 2, "name": "Garaje" }
  ]
}

## Creación exitosa (201):

{
  "success": true,
  "data": {
    "id": 12
  }
}

---

# ❌ Error Response Format

Todos los errores deben seguir esta estructura:

{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE"
  }
}

## Códigos de error comunes

- VALIDATION_ERROR   → input inválido o faltante
- NOT_FOUND          → recurso no encontrado
- UNAUTHORIZED       → usuario no autenticado
- FORBIDDEN          → usuario autenticado sin permisos suficientes
- CONFLICT           → violación de referencia entre registros (FK)
- DUPLICATE          → valor único duplicado
- GONE               → recurso deprecated, usar el reemplazo indicado en el mensaje
- INTERNAL_ERROR     → error interno del servidor

---

# 🔢 Status Codes

- 200 → éxito general
- 201 → recurso creado
- 400 → error de validación
- 401 → no autenticado
- 403 → sin permisos (autenticado pero no admin)
- 404 → recurso no encontrado
- 409 → conflicto de referencia (FK violation) o duplicado
- 410 → recurso deprecated (GONE; ver Items legacy: POST/PUT /items → usar /products)
- 500 → error interno

---

# 📅 Manejo de Fechas

- Usar formato ISO: YYYY-MM-DD
- El backend debe validar las fechas recibidas
- Las fechas almacenadas en DB se devuelven en ISO 8601

---

# 🔐 Autenticación

- Usar autenticación basada en sesión (express-session)
- Las rutas protegidas deben requerir sesión válida
- Devolver 401 si el usuario no está autenticado

---

# 🧠 Reglas de comportamiento del backend

- Siempre validar el input antes de procesar
- Nunca exponer errores internos (stack traces, mensajes de Prisma)
- Siempre devolver respuestas consistentes
- El group_id sale siempre de la sesión, nunca del request

---

# 🚫 Qué Evitar

- NO devolver la respuesta cruda de Prisma/DB sin transformar
- NO mezclar formatos de respuesta entre endpoints
- NO usar el body para filtros (solo query params)
- NO exponer IDs o datos internos sensibles innecesariamente

---

# 🎯 Objetivo

Crear una API predecible y consistente
que sea fácil de consumir desde el frontend.
