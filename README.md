# Multi Store

Inventario multiusuario: items, ubicaciones jerárquicas y etiquetas por grupo.

- `back-multi-store/` — API Express 5 + Prisma 7 + PostgreSQL (sesiones en Postgres)
- `front-multi-store/` — Vue 3 + Tailwind v4 + Pinia + Axios
- `docker/` — PostgreSQL local
- `docs/` — reglas de arquitectura, contrato de API y design system

## Puesta en marcha

Requisitos: Node 20+ y Docker.

```bash
# 1. Base de datos (Postgres en localhost:5434)
docker compose -f docker/docker-compose.yml up -d

# 2. Backend (http://localhost:3200)
cd back-multi-store
cp .env.example .env          # completar SESSION_SECRET (openssl rand -hex 32)
npm install
npx prisma migrate dev        # aplica migraciones y genera el cliente
npm run db:seed               # datos demo: demo@example.com / demo12345
npm run dev

# 3. Frontend (http://localhost:5175)
cd ../front-multi-store
cp .env.example .env
npm install
npm run dev
```

## Tests

```bash
cd back-multi-store && npm test    # services con repositories mockeados
cd front-multi-store && npm test   # stores y utils
```

## Puertos

| Servicio   | Puerto |
|------------|--------|
| PostgreSQL | 5434   |
| API        | 3200   |
| Web        | 5175   |

Elegidos para no chocar con otros proyectos locales (stock-control usa 5433 / 3000 / 5173).
