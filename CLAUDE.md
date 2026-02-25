# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Overview

TG-Template webapp - Vue.js frontend with Node.js serverless backend (BFF pattern).

**Part of tg-template modernization** - see `~/Projects/tg-template/MODERNIZATION_PLAN.md`

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Vue.js | 3.4.x |
| Build | Vite | 5.x |
| State | Pinia | 2.x |
| Router | Vue Router | 4.x |
| HTTP | Axios | 1.x |
| Backend | Hono on Lambda | 20.x |
| DB | mysql2 | 3.x |
| Local Dev | @hono/node-server | 1.x |

## Project Structure

```
├── frontend/                 # Vue.js SPA
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── composables/      # Vue composition functions
│   │   ├── router/           # Vue Router config
│   │   ├── services/         # API clients
│   │   ├── stores/           # Pinia stores
│   │   └── views/            # Page components
│   └── vite.config.js
├── backend/                  # Node.js Lambda (BFF)
│   └── src/
│       ├── app.js            # Hono app (routes, CORS, middleware, error handling)
│       ├── index.js          # Lambda entry point (hono/aws-lambda)
│       ├── serve.js          # Local dev entry point (@hono/node-server)
│       ├── handlers/         # Route handlers (HTTP logic only)
│       ├── repositories/     # Database queries (all SQL lives here)
│       ├── middleware/        # Auth middleware + Lambda Authorizer
│       └── utils/            # Helpers (db.js connection pool)
├── cron/                     # Scheduled Lambdas (EventBridge → Lambda)
│   └── src/
│       ├── handlers/         # Cron job handlers
│       └── utils/            # DB + mail helpers
├── deployment/
│   └── templates/
│       ├── iac/              # CloudFormation (master, lambda, api-gateway, cron, s3)
│       └── pipeline/         # Environment parameters (dev, acc, prd)
└── scripts/                  # Build, dev, package scripts
```

## Backend Architecture

Single Hono app, two entry points:

| Entry point | File | Runtime |
|-------------|------|---------|
| Lambda | `src/index.js` | `hono/aws-lambda` adapter |
| Local dev | `src/serve.js` | `@hono/node-server` |

### Layers

```
handler (HTTP request/response) → repository (SQL queries) → utils/db.js (connection pool)
```

- **Handlers** — parse request, call repositories, return `c.json()` responses
- **Repositories** — contain all SQL, return plain data objects
- **utils/db.js** — mysql2 connection pool, shared by backend and cron

### API Routes

| Method | Route | Auth | Handler |
|--------|-------|------|---------|
| GET | `/api/health` | Public | `health.js` |
| POST | `/api/auth/token` | Public | `auth.js` exchangeToken |
| GET | `/api/auth/userinfo` | Public | `auth.js` getUserInfo |
| GET | `/api/auth/me` | Protected | `auth.js` getMe |
| GET | `/api/dashboard/stats` | Protected | `dashboard.js` getStats |
| GET | `/api/test-guidelines` | Protected | `test-guidelines.js` list |
| GET | `/api/test-guidelines/:id` | Protected | `test-guidelines.js` get |

### AWS Lambda Functions

| Lambda | Handler | Purpose |
|--------|---------|---------|
| BFF | `src/index.handler` | Hono app — all API routes |
| Authorizer | `src/middleware/auth.authorizer` | API Gateway token validation |
| TG Status Updater | `src/handlers/tg-status-updater.handler` | Daily status transitions (cron) |
| IE Status Updater | `src/handlers/ie-status-updater.handler` | Deactivate IE users (cron) |
| Deadline Reminder | `src/handlers/deadline-reminder.handler` | Email notifications (cron) |

## Commands

```bash
# Frontend
cd frontend && npm run dev      # Vite dev server (5173)

# Backend
cd backend && npm run dev       # Hono dev server (3001)

# Both (recommended)
./scripts/dev.sh                # Starts both with concurrently

# Build for deployment
./scripts/build.sh
```

## Local Development

Frontend proxies `/api/*` to backend at localhost:3001.

```
Browser → Vite (5173) → Proxy /api → Hono (3001) → RDS Dev (VPN)
```

Access via: `http://local-dev.wipo.int:5173` (requires `/etc/hosts` entry)

### Environment

Single `.env` at repo root, loaded by `serve.js` from `../../.env`.

Key variables:
- `DEV_BYPASS_AUTH=true` — skip OAuth, use mock user
- `DEV_MOCK_USER=USERNAME` — which user to mock from database
- `FRONTEND_URL` — CORS origin

## Authentication

- **AWS:** API Gateway Lambda Authorizer validates token → BFF Lambda handles request
- **Local:** Hono auth middleware validates token (or bypasses in dev mode)
- **Dev bypass:** Set `DEV_BYPASS_AUTH=true` in `.env` to skip OAuth entirely

## Migration Status

Migrating from JSF/PrimeFaces monolith. See MODERNIZATION_PLAN.md for progress.

| Page | Status |
|------|--------|
| Dashboard | In Progress |
| TG List | Planned |
| User Management | Planned |

## Related Repos

- `tg-template` - Legacy monolith (launchpad)
- `tg-template-infra` - Shared infrastructure
- `tg-template-api` - Public REST API
- `tg-template-doc-generate` - Document generation
- `tg-template-doc-compare` - Document comparison
