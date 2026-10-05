# 🧠 Project Overview

Multi Store: sistema de inventario multiusuario. Cada grupo (hogar, negocio, equipo)
registra sus cosas, dónde están guardadas y cuánto valen.

Inspirado funcionalmente en HomeBox (https://github.com/hay-kot/homebox), escrito desde cero:
no contiene código de HomeBox ni deriva de él. HomeBox es AGPL-3.0, así que NUNCA copiar
código suyo (ni fragmentos); usarlo solo como referencia funcional.

Licencia: propietaria (ver `LICENSE`).

Objetivos principales:
- Registrar items con datos de compra, garantía y notas
- Organizarlos en ubicaciones jerárquicas y clasificarlos con etiquetas
- Buscar y filtrar rápido
- Varios usuarios por grupo (admin / colaborador)

El sistema debe ser simple, rápido y fácil de usar.

---

# ⚙️ Tech Stack

Frontend (`front-multi-store/`):
- Vue 3 (Composition API)
- Tailwind CSS v4
- Axios (cliente HTTP centralizado)
- Pinia (estado global)
- lucide-static (íconos)

Backend (`back-multi-store/`):
- Node.js (CommonJS)
- Express 5
- Prisma 7 ORM (PostgreSQL) con `@prisma/adapter-pg`
- express-session + connect-pg-simple (autenticación)
- bcrypt (hashing de contraseñas)

Base de datos:
- PostgreSQL 16 (Docker local, puerto 5434 — ver `docker/docker-compose.yml`)

---

# 📐 Core Concepts

## Grupos (groups)
- Unidad de aislamiento: todo dato pertenece a un grupo
- El registro público crea un grupo nuevo con su usuario admin

## Usuarios (users)
- `role`: `admin` | `member`
- Los admins gestionan usuarios del grupo; siempre debe quedar al menos un admin

## Ubicaciones (locations)
- Jerárquicas vía `parent_id` (Casa > Garaje > Estantería)
- Sin ciclos; al borrar, hijos e items quedan sin ubicación

## Etiquetas (labels)
- Nombre único por grupo, color opcional `#rrggbb`
- Relación muchos-a-muchos con items

## Items
- Cantidad, marca, modelo, n° de serie, precio y fecha de compra, garantía, notas
- `is_archived` en lugar de borrar lo que ya no se usa
- Valor total del grupo = Σ `purchase_price × quantity` de items no archivados

---

# 🧠 AI Behavior Rules

- Siempre seguir las reglas de arquitectura definidas en `docs/`
- No introducir nuevas tecnologías sin pedido explícito
- Priorizar simplicidad sobre complejidad
- Generar código limpio y listo para producción
- Si algo no está claro, preguntar antes de asumir

---

# 🎯 Development Philosophy

- MVP primero, no diseñar para el futuro hipotético
- Simple y directo
- Usabilidad real por encima de elegancia técnica
- Sin sobre-ingeniería

---

# 📋 Reglas por área

| Área       | Archivo                    |
|------------|----------------------------|
| API        | `docs/api-contract.md`     |
| Backend    | `docs/backend-rules.md`    |
| Frontend   | `docs/frontend-rules.md`   |
| UI         | `docs/ui-rules.md`         |

---

# ✅ Token Efficient Rules

1. Think before acting. Read existing files before writing code.
2. Be concise in output but thorough in reasoning.
3. Prefer editing over rewriting whole files.
4. Do not re-read files you have already read unless the file may have changed.
5. Test your code before declaring done.
6. No sycophantic openers or closing fluff.
7. Keep solutions simple and direct.
8. User instructions always override this file.
