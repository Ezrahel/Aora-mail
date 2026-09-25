# Aora — Client

Next.js frontend for the Aora business email platform.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- React Hook Form + Zod
- TanStack Query
- Lucide icons

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mock API

By default `NEXT_PUBLIC_USE_MOCK_API=true`. The typed client in `src/lib/api/client.ts` uses in-browser mock adapters (`src/lib/api/mock/`) until the backend is available.

Set `NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_URL` to point at the real API.
