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

GET    /dashboard              → { total_items, total_locations, total_labels, total_value }

## Items

GET    /items                  → listar paginado (?search= ?location_id= ?label_id= ?archived=true ?page= ?pageSize=)
GET    /items/:id              → detalle (incluye location y labels)
POST   /items                  → crear
PUT    /items/:id              → actualizar (reemplaza label_ids)
DELETE /items/:id              → eliminar

## Locations (Ubicaciones)

GET    /locations              → lista plana con parent_id e item_count (el front arma el árbol)
GET    /locations/:id          → detalle con parent y children
POST   /locations              → crear (body: name, description?, parent_id?)
PUT    /locations/:id          → actualizar (valida ciclos)
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
