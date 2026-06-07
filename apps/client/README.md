# PERN Stack Docker Setup

> **P**ostgreSQL · **E**xpress · **R**eact · **N**ode.js

## File structure

```
.
├── Dockerfile                  # Multi-stage: base → development | production
├── docker-compose.yaml         # Base services (shared config)
├── docker-compose.dev.yaml     # Dev overrides (hot-reload, pgAdmin, debug ports)
├── docker-compose.prod.yaml    # Prod overrides (Nginx, resource limits, no mounts)
├── .env.example                # All supported env variables — copy to .env
├── nginx/
│   └── conf.d/
│       └── default.conf        # Nginx reverse-proxy + SPA config
└── db/
    └── init/                   # Optional .sql / .sh init scripts for Postgres
```

---

## Quick start

### 1. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your real values (at minimum set POSTGRES_PASSWORD)
```

### 2. Development

```bash
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build
```

| Service  | URL                   |
| -------- | --------------------- |
| React    | http://localhost:5173 |
| API      | http://localhost:3000 |
| pgAdmin  | http://localhost:5050 |
| Postgres | localhost:5432        |

**Node.js debugger** is exposed on port `9229` — attach VS Code with:

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Docker",
  "port": 9229,
  "restart": true
}
```

### 3. Production

```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up --build -d
```

- Nginx listens on **80** (redirects to 443) and **443** (HTTPS).
- Place your TLS certificates in `./nginx/certs/` as `fullchain.pem` and `privkey.pem`.
- The API is **not** published externally — only Nginx proxies to it on the internal network.
- React static files are served directly by Nginx from `./client/dist`.

---

## Dockerfile stages

| Stage         | Purpose                                          |
| ------------- | ------------------------------------------------ |
| `base`        | Alpine Node 20, system deps, production `npm ci` |
| `development` | Adds devDependencies; runs Vite dev / nodemon    |
| `production`  | Runs `npm run build`; drops to non-root user     |

---

## Common commands

```bash
# View logs for a specific service
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml logs -f api

# Open a psql shell
docker compose exec db psql -U postgres -d app

# Rebuild a single service
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build api

# Stop and remove volumes (destructive)
docker compose down -v
```
