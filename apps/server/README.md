# Express TypeScript API — Demo

A fully-typed REST API built with **Express**, **TypeScript**, **PostgreSQL** (`pg`), and **pnpm**.  
Auto-creates tables and seeds demo data on first run.

---

## Quick Start (local)

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env   # default password is "postgres"

# 4. Run dev server (hot-reload via ts-node-dev)
pnpm dev
```

Server: **http://localhost:3000**

---

## Scripts

| Command            | Description                              |
|--------------------|------------------------------------------|
| `pnpm dev`         | Dev server with hot-reload               |
| `pnpm build`       | Compile TypeScript → `dist/`             |
| `pnpm start`       | Run compiled JS from `dist/`             |
| `pnpm typecheck`   | Type-check without emitting              |

---

## Docker

The `Dockerfile` has three named targets:

| Target        | Purpose                                    | Base image        |
|---------------|--------------------------------------------|-------------------|
| `base`        | Node 20 Alpine + corepack/pnpm + manifests | `node:20-alpine`  |
| `development` | Full deps + ts-node-dev hot-reload         | `base`            |
| `build`       | tsc compile + pnpm prune (intermediate)    | `base`            |
| `production`  | Compiled JS only, non-root user, healthcheck | `node:20-alpine` |

### Build manually

```bash
# Development image
docker build --target development -t express-api:dev .

# Production image
docker build --target production -t express-api:prod .
```

### Run with Docker Compose

```bash
# Dev (hot-reloads src/ changes via volume mount)
docker compose up api-dev

# Production (compiled, hardened, non-root)
docker compose --profile prod up api-prod

# pgAdmin UI at http://localhost:5050
docker compose --profile tools up pgadmin
```

---

## Endpoints

### Health / Info
```
GET  /health
GET  /api
```

### Users  `/api/users`

| Method | Path   | Description            |
|--------|--------|------------------------|
| GET    | `/`    | List users (paginated) |
| POST   | `/`    | Create user            |
| GET    | `/:id` | Get user by ID         |
| PATCH  | `/:id` | Update user fields     |
| DELETE | `/:id` | Delete user            |

Query params: `?page=1&limit=10`

### Products  `/api/products`

| Method | Path   | Description                    |
|--------|--------|--------------------------------|
| GET    | `/`    | List products (filterable)     |
| POST   | `/`    | Create product                 |
| GET    | `/:id` | Get product by ID              |
| PATCH  | `/:id` | Update product fields          |
| DELETE | `/:id` | Delete product                 |

Query params: `?page=1&limit=10&category=Electronics&minPrice=10&maxPrice=100`

### Orders  `/api/orders`

| Method | Path          | Description                      |
|--------|---------------|----------------------------------|
| GET    | `/`           | List orders (filterable)         |
| POST   | `/`           | Create order (transactional)     |
| GET    | `/:id`        | Get order with items             |
| PATCH  | `/:id/status` | Update order status              |

Query params: `?page=1&limit=10&status=pending&user_id=2`

---

## Example Requests

```bash
# List Electronics under $100
curl "http://localhost:3000/api/products?category=Electronics&maxPrice=100"

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Frank","email":"frank@example.com","role":"user"}'

# Place an order (transactional — checks & decrements stock)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"items":[{"product_id":3,"quantity":2},{"product_id":5,"quantity":1}]}'

# Ship an order
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'
```

---

## Project Structure

```
src/
├── index.ts                    ← bootstrap, middleware, routes
├── db/
│   ├── pool.ts                 ← pg Pool + typed query helper
│   └── migrations.ts           ← DDL + seed data
├── models/types.ts             ← TypeScript interfaces & DTOs
├── controllers/
│   ├── usersController.ts
│   ├── productsController.ts
│   └── ordersController.ts
├── routes/index.ts             ← all Express routers
└── middleware/errorHandler.ts  ← AppError + pg error mapping
```
