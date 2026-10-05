# 🎨 Frontend Architecture Rules

Estamos construyendo una aplicación web de inventario con Vue 3.

El frontend debe ser:
- simple
- rápido
- limpio
- fácil de mantener

---

# ⚙️ Tech Stack

- Vue 3 (Composition API)
- Tailwind CSS v4
- Pinia (estado global)
- Axios (cliente HTTP centralizado)

---

# 🧱 Estructura del Proyecto

src/
  components/
  views/
  layouts/
  stores/
  services/
  router/
  utils/        → helpers puros (formato, árbol de ubicaciones)

---

# 🧠 State Management (Pinia)

- Usar Pinia para estado global
- NO usar variables reactivas globales fuera de Pinia
- Mantener los stores limpios y enfocados

Stores activos:
- authStore       → usuario autenticado, rol, login/register/logout
- toastStore      → notificaciones globales (add, remove)
- itemsStore      → listado de items, filtros y paginación
- catalogStore    → ubicaciones (con árbol) y etiquetas

---

# 🌐 API Layer

- NUNCA llamar a axios directamente dentro de los componentes o views
- Siempre usar la capa de servicios

Estructura:
- services/apiClient.js     → instancia axios centralizada (baseURL, headers, interceptors)
- services/AuthService.js
- services/DashboardService.js
- services/ItemsService.js
- services/LocationsService.js
- services/LabelsService.js
- services/UsersService.js

---

# 📦 API Client (apiClient.js)

Crear una instancia centralizada de Axios:

```js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor de errores centralizado
apiClient.interceptors.response.use(
  res => res,
  err => {
    // manejo global de errores aquí
    return Promise.reject(err)
  }
)

export default apiClient
```

Todos los servicios importan `apiClient`, no `axios` directamente.

---

# 🔗 Variables de Entorno

El frontend usa Vite, por lo tanto las vars deben tener el prefijo `VITE_`:

VITE_API_URL=http://localhost:3200/api

Nunca hardcodear URLs en los servicios.

---

# ⚠️ Reglas Críticas

- NUNCA mezclar lógica de negocio dentro de los componentes
- Los componentes deben ser lo más "tontos" posible
- La lógica vive en:
  - stores
  - services

---

# 🧩 Componentes

- Deben ser reutilizables
- Pequeños y enfocados en una sola responsabilidad
- Evitar componentes monolíticos grandes

Componentes base (`components/ui/`):
- AppModal
- PageHeader
- LabelBadge
- SkeletonBlock

Íconos: `lucide-static` (font). Clases `icon-<nombre>`, p. ej. `icon-map-pin`.

---

# 🗂️ Views

- Representan páginas completas
- Pueden orquestar componentes y llamar al store
- No deben contener lógica pesada

Vistas actuales:
- LoginView / RegisterView → autenticación
- DashboardView            → KPIs del grupo
- ItemsView                → listado con búsqueda, filtros y paginación
- ItemFormView             → alta/edición de item (página dedicada)
- LocationsView            → CRUD de ubicaciones en árbol
- LabelsView               → CRUD de etiquetas
- UsersView                → CRUD de usuarios (solo admin)

---

# 🔄 Data Flow

View → llama store
Store → llama service
Service → llama apiClient (Axios)

---

# 🔐 Autenticación

- Guardar estado de sesión en Pinia (authStore)
- Verificar autenticación al cargar la app
- Redirigir usuarios no autenticados al login

---

# 🎯 UX Rules

Esta es una herramienta de uso diario.

Prioridades:
- velocidad
- claridad
- mínima cantidad de clicks

Evitar:
- `alert()` del navegador para validaciones — usar mensajes inline o toast
- Mostrar errores técnicos al usuario — mostrar mensajes amigables

---

# 📱 Responsive Design

- Mobile-first
- El sidebar colapsa en mobile
- Las cards se apilan verticalmente en pantallas pequeñas

---

# 🧪 Tests

- Vitest + happy-dom en `src/__tests__/`
- Stores con los services mockeados (`vi.mock`)

---

# 🎨 Estilos

- Usar Tailwind CSS v4
- Evitar CSS custom a menos que sea necesario
- Mantener espaciado y layout consistente con el design system en `docs/ui-rules.md`

---

# 🚫 Qué Evitar

- NO usar librerías innecesarias
- NO sobreingeniería en componentes
- NO duplicar lógica entre stores y servicios
- NO hardcodear la URL de la API
- NO llamar axios directamente (siempre via apiClient)

---

# 🧠 Code Style

- Nombres claros y descriptivos
- Preferir Composition API
- Usar async/await (no .then chains)
- Manejar errores correctamente en todos los async calls
