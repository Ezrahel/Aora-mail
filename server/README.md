# Aora Server

Production-oriented TypeScript backend abstracting MXroute behind our own API.

## Stack
- Node.js + Express + TypeScript (strict)
- PostgreSQL + Prisma
- Redis + BullMQ (optional, graceful fallback to inline)
- Zod + JWT (httpOnly cookies)
- Paystack, MXroute, Cloudflare adapters via provider interfaces

## Quick start

```bash
cp .env.example .env
# Edit DATABASE_URL etc.
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

Health: `GET /health/ready`

## API
Both `/api` and `/api/v1` are served for compatibility.

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET  /api/v1/plans`
- `POST /api/v1/domains`
- `POST /api/v1/domains/:id/verify`
- `POST /api/v1/mailboxes`
- `POST /api/v1/webhooks/paystack` (verifies signature, idempotent)
- `GET  /api/v1/usage`
- `GET  /api/admin/metrics` (requires X-Admin-Token or admin@aora.ng)

Docs: `GET /api/docs/openapi.json`

## Env

See `.env.example`.

## Tests

```bash
npm test
```
