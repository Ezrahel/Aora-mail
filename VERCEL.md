# Vercel Services deployment

The root `vercel.json` defines a Next.js service (`client`) and an Express
service (`server`). Public requests under `/api/` reach Express unchanged;
all other paths reach Next.js. The browser calls `/api` on the same origin.
No service-to-service binding is needed: the current Next.js API calls run in
the browser, while Express calls external providers, not the Next.js service.
Do not expose a Vercel internal binding URL as a `NEXT_PUBLIC_` variable.

## Project setup

1. In Vercel project settings, set the framework preset to **Services** and
   keep the project root at the repository root. Use a current Vercel CLI that
   supports Services.
2. Configure each environment (Preview and Production) with its own managed,
   reachable CockroachDB `DATABASE_URL`, Redis `REDIS_URL`, strong
   `JWT_SECRET` and `SESSION_SECRET`, provider credentials, and transactional
   email delivery settings. Never commit credentials. The database schema must
   be provisioned separately; builds do not push schemas or seed accounts.
3. Set `CLIENT_URL`, `NEXT_PUBLIC_SITE_URL`, and `CORS_ORIGIN` to the intended
   HTTPS origin(s). Leave `API_PREFIX=/api`. Leave `NEXT_PUBLIC_API_URL` unset
   or set it to `/api`, and `NEXT_PUBLIC_USE_MOCK_API=false`. Next.js embeds
   `NEXT_PUBLIC_` settings at build time, so redeploy after changing them.
   Remove any old `http://localhost:4000/api` Vercel environment setting.
4. Configure the Bachs webhook against the public HTTPS
   `/api/webhooks/bachs` route for the appropriate deployment. Verify provider
   integration and webhook signatures in a sandbox before accepting payments.
5. From the repository root, run `vercel dev` (or `vercel dev -L` for local
   mode), then check `/`, `/api/v1/plans`, authentication, and the webhook
   route. Local services still need a reachable CockroachDB and Redis. To run
   Next.js and Express separately instead, set `NEXT_PUBLIC_API_URL` in
   `client/.env.local` to `http://localhost:4000/api`.

Express health routes currently live at `/health`, `/health/live`, and
`/health/ready`; they are **not** exposed by the proposed routing. `/health`
is handled by the client catch-all unless a separate server rewrite is added.

## Important operational limitations

Vercel imports `server/app.ts` as a request handler; it does not run the
long-lived `server/src/main.ts` process. Consequently the 30-minute usage-sync
timer in that process will not run on Vercel. A separately configured scheduler
and a durable worker are required for scheduled sync and background jobs;
serverless requests are not a substitute for an always-on worker. The existing
rate limiter uses per-process memory, not a shared Redis-backed store. Before
production, address these limitations and the other security, payment,
provider, migration, backup, and observability gaps identified in the project.
Do not run the demo seed against a production database.
