# Express TypeScript API — Demo

A fully-typed REST API built with **Express**, **TypeScript**, and **PostgreSQL** (`pg`).  
Auto-creates tables and seeds demo data on first run.

---

## Quick Start

### 1 — Start PostgreSQL (Docker)

```bash
docker compose up -d postgres
```

### 2 — Install dependencies

```bash
npm install
```

### 3 — Configure environment

```bash
cp .env.example .env   # edit DB_PASSWORD if needed (default: postgres)
```

### 4 — Run in dev mode (hot reload)

```bash
npm run dev
```

The server runs at **http://localhost:3000**.  
On first boot it creates tables, runs migrations, and seeds 5 users, 8 products, and 5 orders.

---

## Scripts

| Command           | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Dev server with hot reload (ts-node-dev) |
| `npm run build`   | Compile TypeScript → `dist/`             |
| `npm start`       | Run compiled JS from `dist/`             |
| `npm run typecheck` | Type-check without emitting files      |

---

## Endpoints

### Health

```
GET  /health
GET  /api
```

### Users  `/api/users`

| Method | Path           | Description          |
|--------|----------------|----------------------|
| GET    | `/`            | List users (paginated) |
| POST   | `/`            | Create user          |
| GET    | `/:id`         | Get user by ID       |
| PATCH  | `/:id`         | Update user fields   |
| DELETE | `/:id`         | Delete user          |

Query params: `?page=1&limit=10`

### Products  `/api/products`

| Method | Path   | Description                       |
|--------|--------|-----------------------------------|
| GET    | `/`    | List products (filterable)        |
| POST   | `/`    | Create product                    |
| GET    | `/:id` | Get product by ID                 |
| PATCH  | `/:id` | Update product fields             |
| DELETE | `/:id` | Delete product                    |

Query params: `?page=1&limit=10&category=Electronics&minPrice=10&maxPrice=100`

### Orders  `/api/orders`

| Method | Path             | Description                |
|--------|------------------|----------------------------|
| GET    | `/`              | List orders (filterable)   |
| POST   | `/`              | Create order (transactional) |
| GET    | `/:id`           | Get order with items       |
| PATCH  | `/:id/status`    | Update order status        |

Query params: `?page=1&limit=10&status=pending&user_id=2`

---

## Example Requests

```bash
# List products in Electronics under $100
curl "http://localhost:3000/api/products?category=Electronics&maxPrice=100"

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Frank","email":"frank@example.com","role":"user"}'

# Create an order (transactional — checks stock)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"items":[{"product_id":3,"quantity":2},{"product_id":5,"quantity":1}]}'

# Update order status
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped"}'
```

---

## Project Structure

```
src/
├── index.ts                  # App entry point & bootstrap
├── db/
│   ├── pool.ts               # pg Pool + query helper
│   └── migrations.ts         # DDL + seed data
├── models/
│   └── types.ts              # TypeScript interfaces & DTOs
├── controllers/
│   ├── usersController.ts
│   ├── productsController.ts
│   └── ordersController.ts
├── routes/
│   └── index.ts              # All routers
└── middleware/
    └── errorHandler.ts       # AppError + global handler
```

---

## Optional — pgAdmin

```bash
docker compose up -d pgadmin
# Open http://localhost:5050
# Login: admin@admin.com / admin
# Add server: host=postgres, db=demo_api, user=postgres, pass=postgres
```
