# BUSINESS EMAIL STARTUP — AI AGENT BUILD PACK

This directory contains two separate build specifications:

- `CLIENT.md` — frontend/client-side implementation
- `SERVER.md` — backend/server-side implementation

## Product

A Nigerian-focused business email startup that allows SMEs to purchase and manage professional email on their own domains.

The initial infrastructure provider is MXroute.

The application must abstract MXroute away from customers.

## Architecture

```text
                    CUSTOMER
                       │
                       ▼
              ┌─────────────────┐
              │   Next.js Web    │
              │   TypeScript     │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Our Backend   │
              │   TypeScript    │
              └────────┬────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      Email Provider          DNS Provider
          Adapter               Adapter
             │                   │
             ▼                   ▼
          MXroute            Cloudflare
```

## Brand

Core palette:

```text
#333333
#6B7280
#FFFFFF
#16FF00
```

Use `#16FF00` sparingly as an ambient/highlight color.

The product should feel:

- premium
- technical
- trustworthy
- modern
- Nigerian
- business-focused
- fast
- clean

Avoid:

- generic AI aesthetics
- excessive neon
- crypto aesthetics
- excessive gradients
- fake testimonials
- fake customer logos
- over-designed dashboards

## MVP Business Flow

```text
Landing page
  ↓
Pricing
  ↓
Register
  ↓
Choose plan
  ↓
Pay
  ↓
Add domain
  ↓
Configure/verify DNS
  ↓
Create mailbox
  ↓
Manage mailbox
```

## Critical Product Principle

The customer should not need to understand MXroute.

Internally:

```text
Customer → Our Backend → MXroute
```

Externally:

```text
Customer → Our Business Email Platform
```

## Build Rules

- TypeScript everywhere.
- Strict typing.
- No `any`.
- No secrets in frontend.
- No direct browser-to-MXroute calls.
- No hardcoded provider credentials.
- Provider-specific logic stays in backend adapters.
- DNS is a separate abstraction from email hosting.
- Payment activation must happen through verified server-side webhooks.
- Provisioning must be idempotent.
- Provider failures must be recoverable.
- Customer-facing errors must not expose provider internals.
- Use database-backed plans and entitlements.
- Keep business rules configurable.
- Write tests around provisioning, billing, authorization, and provider adapters.

## MVP Scope

Build:

- marketing website
- authentication
- organization/account management
- plans
- subscriptions
- Paystack payments
- domain management
- DNS setup/verification
- mailbox management
- MXroute integration
- usage
- provisioning jobs
- audit logs
- basic admin functionality

Do not build:

- custom email server
- custom IMAP/SMTP
- custom webmail client
- mass email platform
- cold-email platform
- unnecessary AI features

## Product Strategy

The product should sell a simple promise:

> Professional business email without unnecessary complexity.

The technical complexity belongs behind the product.

cd server && npm install && npx prisma generate && npx prisma migrate dev && npm run dev