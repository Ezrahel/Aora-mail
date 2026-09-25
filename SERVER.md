# SERVER-SIDE BUILD SPEC — BUSINESS EMAIL STARTUP

## 0. Role

You are the lead backend/platform engineer for a startup providing professional business email to Nigerian SMEs.

Build a production-oriented TypeScript backend that abstracts third-party email infrastructure behind our own API.

The client application MUST NOT communicate directly with MXroute or any future email provider.

Architecture:

```text
Browser
   ↓
Our Next.js frontend
   ↓
Our backend/API
   ↓
Provider abstraction layer
   ↓
MXroute initially
   ↓
Email infrastructure
```

The system must be designed so MXroute can eventually be replaced or supplemented by Zoho, Microsoft 365, Google Workspace, Titan, or another provider without rewriting the frontend.

---

# 1. Technology

Use TypeScript.

Preferred stack:

- Node.js
- NestJS OR a clean Next.js server/API architecture if the existing project requires one
- PostgreSQL
- Prisma ORM
- Redis where queues/caching/rate limiting materially benefit the system
- Zod or class-validator for validation
- JWT/session-based authentication using secure HTTP-only cookies
- Paystack for Nigerian payments initially
- Cloudflare DNS API optionally for automated DNS management
- MXroute REST API as the initial email infrastructure provider

Use strict TypeScript.

Do not use `any`.

Do not put provider credentials in source code.

---

# 2. Core Business Model

The company sells professional business email.

Customers may:

- create an account
- create a business
- buy a plan
- add/connect a domain
- verify domain ownership
- configure DNS
- create mailboxes
- manage mailboxes
- monitor usage
- manage subscriptions
- pay invoices
- request migration/support

MXroute is infrastructure.

It must never become the public business model exposed through the API.

---

# 3. Provider Abstraction

Create an interface such as:

```ts
interface EmailProvider {
  createDomain(input: CreateDomainInput): Promise<ProviderDomain>;
  deleteDomain(input: DeleteDomainInput): Promise<void>;
  getDomain(input: GetDomainInput): Promise<ProviderDomain>;
  getDomainDns(input: GetDomainDnsInput): Promise<ProviderDnsRecords>;

  createMailbox(input: CreateMailboxInput): Promise<ProviderMailbox>;
  updateMailbox(input: UpdateMailboxInput): Promise<ProviderMailbox>;
  deleteMailbox(input: DeleteMailboxInput): Promise<void>;
  suspendMailbox(input: SuspendMailboxInput): Promise<void>;
  unsuspendMailbox(input: UnsuspendMailboxInput): Promise<void>;

  createForwarder(input: CreateForwarderInput): Promise<ProviderForwarder>;
  deleteForwarder(input: DeleteForwarderInput): Promise<void>;

  getUsage(input: GetUsageInput): Promise<ProviderUsage>;
}
```

Implement:

```text
EmailProvider
      │
      └── MXRouteProvider
```

The rest of the application must depend on `EmailProvider`, NOT directly on `MXRouteProvider`.

---

# 4. MXroute Integration

Implement the current MXroute REST API as a provider adapter.

The API uses credentials including:

- X-Server
- X-Username
- X-API-Key

Store credentials securely in server-side environment variables or a secret manager.

Never expose them to the browser.

Use the documented MXroute API endpoints.

Current API capabilities to support where applicable:

- domains
- email accounts
- forwarders
- catch-all
- spam configuration
- reseller users
- reseller packages
- quotas
- DNS information
- verification key
- suspend/unsuspend operations

The provider adapter should normalize MXroute responses into our internal models.

---

# 5. Important DNS Principle

MXroute can provide the DNS records/information required for a domain, but our application must distinguish:

1. Email infrastructure configuration
2. DNS configuration

Do NOT assume MXroute is the DNS provider.

Create a separate abstraction:

```ts
interface DnsProvider {
  getRecords(domain: string): Promise<DnsRecord[]>;
  createRecord(input: CreateDnsRecordInput): Promise<DnsRecord>;
  updateRecord(input: UpdateDnsRecordInput): Promise<DnsRecord>;
  deleteRecord(input: DeleteDnsRecordInput): Promise<void>;
  verifyDomain(input: VerifyDomainInput): Promise<VerificationResult>;
}
```

Initial implementation:

```text
DnsProvider
   └── CloudflareDnsProvider
```

Also support manual DNS setup.

A customer should be able to use any registrar/DNS host even if we cannot automatically modify their DNS.

---

# 6. Domain Flow

When a customer adds:

```text
company.com
```

the server should:

1. Validate domain.
2. Check whether the customer already owns it in our system.
3. Create an internal domain record.
4. Provision it with the email provider if appropriate.
5. Retrieve required DNS records.
6. Store expected DNS records.
7. Attempt automatic DNS configuration if customer connected a supported DNS provider.
8. Otherwise present manual DNS instructions.
9. Verify DNS.
10. Mark domain as verified/active.

Domain states:

```ts
type DomainStatus =
  | "pending"
  | "provisioning"
  | "dns_pending"
  | "verifying"
  | "verified"
  | "active"
  | "error"
  | "suspended";
```

Never mark a domain active simply because a provider API call succeeded.

---

# 7. Mailbox Flow

Example:

```text
POST /api/v1/mailboxes
```

Request:

```json
{
  "domainId": "domain-id",
  "localPart": "info",
  "quotaGb": 5
}
```

Server:

1. Authenticate customer.
2. Authorize ownership of domain.
3. Check subscription entitlement.
4. Validate local part.
5. Check mailbox limits.
6. Provision mailbox through `EmailProvider`.
7. Store provider ID/reference.
8. Return normalized mailbox object.

Do not trust quota values sent by the browser.

The backend must calculate allowed quota from the customer's plan.

---

# 8. Mailbox Model

Internal mailbox model:

```text
Mailbox
- id
- customerId
- domainId
- provider
- providerMailboxId
- email
- quotaBytes
- usedBytes
- status
- createdAt
- updatedAt
```

Provider-specific identifiers should remain internal.

---

# 9. Plans

Create database-backed plans.

Example:

```text
Starter
- annualPrice
- monthlyPrice
- maxMailboxes
- mailboxQuotaGb
- maxDomains
- aliasesAllowed
- forwardingAllowed
- migrationIncluded

Business
...

Pro
...
```

Do not hardcode business pricing throughout the codebase.

Pricing should be configurable.

---

# 10. Entitlements

Build an entitlement service.

Example:

```ts
interface PlanEntitlements {
  maxMailboxes: number;
  maxDomains: number;
  mailboxQuotaGb: number;
  aliasesAllowed: boolean;
  forwardingAllowed: boolean;
  migrationIncluded: boolean;
}
```

Every protected business operation must check entitlement server-side.

---

# 11. Customers and Organizations

Use an organization-based architecture.

```text
User
  ↓
Organization
  ↓
Subscription
  ↓
Domains
  ↓
Mailboxes
```

A user may eventually belong to multiple organizations.

Do not tie business resources directly to an individual user if an organization model is more appropriate.

---

# 12. Suggested Database Models

At minimum:

```text
User
Organization
OrganizationMember
Domain
Mailbox
Forwarder
DnsRecord
Plan
Subscription
Payment
Invoice
ProviderAccount
ProvisioningJob
AuditLog
SupportTicket
```

Optional later:

```text
DomainRegistrarConnection
DnsProviderConnection
EmailMigration
UsageSnapshot
Coupon
Referral
```

---

# 13. Authentication

Implement:

- registration
- email verification
- login
- logout
- password reset
- session management
- password hashing
- account lock/rate limiting where appropriate

Use secure HTTP-only cookies.

Never store authentication tokens in localStorage unless there is a specific architectural reason.

Password requirements must be sensible, not absurdly restrictive.

---

# 14. Authorization

Every organization resource must be scoped.

Example:

A user belonging to Organization A must never be able to access:

```text
Organization B
Organization B's domains
Organization B's mailboxes
Organization B's invoices
Organization B's provider IDs
```

Use centralized authorization checks.

Never rely on IDs being unguessable as the only security mechanism.

---

# 15. Payment System

Integrate Paystack initially.

Payment flow:

```text
Customer
   ↓
Select plan
   ↓
Create checkout session
   ↓
Paystack
   ↓
Payment
   ↓
Webhook
   ↓
Verify transaction
   ↓
Activate subscription
   ↓
Provision entitled services
```

IMPORTANT:

Never activate paid services based solely on a frontend redirect.

The server must verify payment using the payment provider.

---

# 16. Webhooks

Create webhook endpoints.

Example:

```text
POST /api/v1/webhooks/paystack
```

Requirements:

- verify signature
- idempotency
- transaction lookup
- safe retries
- event logging
- no duplicate provisioning

Store processed webhook event IDs.

A webhook must be safe to receive more than once.

---

# 17. Provisioning Jobs

Email provisioning should support asynchronous jobs.

Do not make complex multi-step provisioning depend on one long HTTP request.

Example:

```text
Payment confirmed
      ↓
ProvisioningJob
      ↓
Create domain
      ↓
Get DNS requirements
      ↓
Configure DNS if possible
      ↓
Verify domain
      ↓
Create mailbox
      ↓
Mark service active
```

Use a queue such as BullMQ + Redis if the project uses Redis.

Job states:

```text
queued
processing
completed
failed
retrying
cancelled
```

---

# 18. Idempotency

Provisioning operations must be idempotent.

If:

```text
Create mailbox info@company.com
```

is called twice because of a timeout, the system must not accidentally create duplicate resources.

Use:

- internal idempotency keys
- provider references
- unique DB constraints
- job locks where necessary

---

# 19. Error Handling

Never return raw MXroute errors to customers.

Bad:

```json
{
  "error": "MXroute API 422: ..."
}
```

Good:

```json
{
  "code": "MAILBOX_PROVISIONING_FAILED",
  "message": "We couldn't create this mailbox right now. Please try again."
}
```

Log provider-specific technical details server-side.

Return safe public messages.

---

# 20. API Design

Use versioned APIs:

```text
/api/v1/auth
/api/v1/organizations
/api/v1/domains
/api/v1/mailboxes
/api/v1/forwarders
/api/v1/dns
/api/v1/plans
/api/v1/subscriptions
/api/v1/payments
/api/v1/invoices
/api/v1/usage
/api/v1/support
/api/v1/webhooks
```

Example:

```http
GET /api/v1/domains
POST /api/v1/domains
GET /api/v1/domains/:id
POST /api/v1/domains/:id/verify
DELETE /api/v1/domains/:id
```

Mailbox:

```http
GET /api/v1/mailboxes
POST /api/v1/mailboxes
GET /api/v1/mailboxes/:id
PATCH /api/v1/mailboxes/:id
POST /api/v1/mailboxes/:id/suspend
POST /api/v1/mailboxes/:id/unsuspend
DELETE /api/v1/mailboxes/:id
```

---

# 21. API Response Format

Use a consistent response format.

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "DOMAIN_NOT_VERIFIED",
    "message": "Verify your domain before creating a mailbox."
  }
}
```

Do not leak stack traces.

---

# 22. Rate Limiting

Protect:

- login
- registration
- password reset
- domain verification
- mailbox creation
- payment endpoints
- public APIs

Also respect upstream MXroute rate limits.

Do not fire provider requests from uncontrolled client loops.

Use queues for operations that may burst.

---

# 23. Provider Rate Limits

The current MXroute API documents approximately:

- GET/read: 100 requests/minute
- POST/PATCH/DELETE/write: 20 requests/minute

Design the provider adapter and queue so we do not accidentally exceed provider limits.

Use retry with exponential backoff for transient failures.

Do not retry permanent validation errors indefinitely.

---

# 24. Usage Synchronization

Create a scheduled process to synchronize mailbox/domain usage.

Example:

```text
Every 30 minutes
    ↓
Fetch provider usage
    ↓
Normalize
    ↓
Store usage snapshot
    ↓
Dashboard reads internal usage
```

Do not query MXroute on every dashboard page load.

---

# 25. Caching

Cache data that does not need real-time accuracy:

- plans
- provider metadata
- DNS instructions where appropriate
- usage snapshots

Do not cache authorization decisions in unsafe ways.

---

# 26. Audit Logs

Record important actions:

```text
USER_REGISTERED
DOMAIN_ADDED
DOMAIN_VERIFIED
MAILBOX_CREATED
MAILBOX_SUSPENDED
MAILBOX_DELETED
PLAN_CHANGED
PAYMENT_COMPLETED
SUBSCRIPTION_CANCELLED
DNS_CONFIGURED
PROVISIONING_FAILED
```

Audit logs should include:

- actor
- organization
- action
- resource
- timestamp
- metadata
- request ID where useful

Never log passwords or provider API keys.

---

# 27. Secrets

Environment variables:

```env
DATABASE_URL=
REDIS_URL=

SESSION_SECRET=

PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=

MXROUTE_SERVER=
MXROUTE_USERNAME=
MXROUTE_API_KEY=

CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

Never commit `.env`.

Provide `.env.example`.

Never return secrets through API responses.

---

# 28. Security

Implement:

- secure cookies
- CSRF protection where applicable
- input validation
- SQL injection protection through ORM
- rate limiting
- authorization
- webhook signature verification
- secure headers
- password hashing
- audit logging
- secret management
- dependency updates
- request IDs
- safe error responses

Do not expose provider credentials.

---

# 29. DNS Automation

If Cloudflare integration is enabled:

```text
Customer connects Cloudflare
        ↓
OAuth/API authorization
        ↓
Server retrieves zone
        ↓
Server creates required records
        ↓
Server verifies DNS
```

If customer does not connect Cloudflare:

```text
Server returns manual DNS instructions
```

The system must support both modes.

Never require Cloudflare to use the product.

---

# 30. Domain Verification

Verification should support:

- DNS TXT verification
- provider-required records
- MX checks
- SPF checks
- DKIM checks

Verification must be server-side.

Use DNS resolution libraries or trusted DNS APIs.

Return normalized statuses:

```ts
type DnsStatus =
  | "missing"
  | "pending"
  | "configured"
  | "verified"
  | "error";
```

---

# 31. Billing States

Subscriptions:

```text
trialing
active
past_due
cancelled
expired
suspended
```

Do not immediately destroy email infrastructure when a payment fails.

Implement a grace period.

The exact grace-period duration must be configurable.

---

# 32. Cancellation

When a customer cancels:

1. Record cancellation.
2. Determine end-of-period date.
3. Keep service active until the configured date unless immediate cancellation is explicitly requested.
4. Notify customer.
5. After expiry, suspend according to business policy.
6. Never immediately delete customer mailboxes unless policy explicitly requires it.

Create data-retention rules.

---

# 33. Provider Failure Strategy

If MXroute is temporarily unavailable:

- Do not mark customer data as deleted.
- Mark provisioning as pending/retry.
- Retry transient failures.
- Show customer a useful status.
- Alert administrators.
- Maintain internal desired state.

Example:

```text
Internal desired state:
info@company.com = ACTIVE

Provider state:
TEMPORARILY_UNAVAILABLE

System:
PROVISIONING_RETRYING
```

---

# 34. Admin System

Create an internal admin API/dashboard architecture.

Admin should eventually see:

- organizations
- customers
- domains
- mailboxes
- subscriptions
- payments
- provisioning jobs
- provider health
- failed operations
- usage
- support tickets
- audit logs

Admin actions must be strongly authorized.

---

# 35. Observability

Every request should have a request ID.

Log:

- request ID
- route
- method
- response status
- latency
- organization ID where safe
- provider operation ID where available

Do not log:

- passwords
- payment secrets
- API keys
- mailbox passwords
- authentication tokens

Add health endpoints:

```text
/health
/health/live
/health/ready
```

Readiness should check required dependencies where appropriate.

---

# 36. Testing

Implement tests for:

### Unit

- plan entitlement logic
- quota calculation
- domain validation
- authorization
- provider adapter mapping
- payment calculations
- subscription states

### Integration

- database
- authentication
- domain lifecycle
- mailbox lifecycle
- payment webhook handling

### Provider adapter

Mock MXroute responses.

Do not depend on live MXroute API in normal automated tests.

---

# 37. Database Constraints

Enforce uniqueness where required.

Examples:

```text
User.email unique
Organization.slug unique
Domain.name unique
Mailbox.email unique
Payment.providerReference unique
WebhookEvent.providerEventId unique
```

Use indexes for common queries.

---

# 38. Business Metrics

Track:

- registered organizations
- paying organizations
- MRR
- ARR
- average revenue per organization
- mailbox count
- average mailboxes per organization
- storage used
- churn
- failed payments
- provisioning failures
- domain verification completion rate
- signup → payment conversion
- payment → active mailbox conversion

Do not expose internal metrics to normal customers.

---

# 39. Important Economics Rule

The backend must not assume:

```text
provider storage = customer allocated storage
```

Plans may allocate quotas that exceed physical provider capacity if the underlying provider supports overselling.

Therefore track:

```text
allocatedQuotaBytes
actualUsedBytes
```

separately.

This allows capacity planning.

Create alerts when actual provider usage reaches configurable thresholds.

Example:

```text
70% → warning
80% → warning
90% → critical
95% → emergency
```

These thresholds must be configurable.

---

# 40. Do Not Build These in MVP

Do NOT build:

- custom mail server
- custom SMTP server
- custom IMAP server
- custom webmail client
- full CRM
- marketing automation
- bulk cold-email system
- mass email sender
- complex AI assistant

The MVP is:

> Sell + provision + manage professional business email.

Use existing provider infrastructure.

---

# 41. Future Provider Support

Design the provider layer so future providers can be added:

```text
providers/
  email/
    email-provider.interface.ts
    mxroute/
      mxroute.provider.ts
      mxroute.mapper.ts
    zoho/
      zoho.provider.ts
    microsoft/
      microsoft.provider.ts
```

The frontend should not know which provider is being used.

---

# 42. Suggested Project Structure

```text
src/
  auth/
  organizations/
  users/
  domains/
  mailboxes/
  forwarders/
  dns/
  plans/
  subscriptions/
  payments/
  invoices/
  usage/
  provisioning/
  providers/
    email/
      email-provider.interface.ts
      mxroute/
    dns/
      dns-provider.interface.ts
      cloudflare/
  webhooks/
  audit/
  admin/
  common/
    guards/
    middleware/
    errors/
    logging/
    validation/
```

---

# 43. API Documentation

Generate OpenAPI/Swagger documentation.

Document:

- authentication
- request schemas
- response schemas
- error codes
- webhook events
- pagination
- authorization requirements

Do not document private admin APIs publicly unless protected.

---

# 44. Pagination

List endpoints must support pagination.

Example:

```text
GET /api/v1/mailboxes?page=1&limit=20
```

Return:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

---

# 45. Final Implementation Rules

Build in this order:

1. Project foundation
2. Database
3. Authentication
4. Organizations
5. Plans
6. Subscriptions
7. Payment integration
8. Provider abstraction
9. MXroute adapter
10. Domains
11. DNS
12. Mailboxes
13. Provisioning queue
14. Usage synchronization
15. Audit logs
16. Admin
17. Tests
18. Documentation
19. Observability
20. Production hardening

At every stage:

- keep types strict
- validate input
- authorize resource ownership
- handle provider failures
- avoid leaking infrastructure details
- write tests for critical business logic

---

# 46. Definition of Done

The backend is complete when this real-world flow works:

```text
User registers
      ↓
Creates organization
      ↓
Chooses plan
      ↓
Pays through Paystack
      ↓
Webhook verified
      ↓
Subscription activated
      ↓
Customer adds domain
      ↓
Domain provisioned through email provider
      ↓
DNS requirements generated
      ↓
DNS automatically configured OR manual instructions shown
      ↓
DNS verified
      ↓
Customer creates mailbox
      ↓
Mailbox provisioned through MXroute
      ↓
Usage synchronized
      ↓
Customer sees active mailbox
```

The system must be designed so the customer sees one coherent product even though multiple third-party systems exist underneath.

The backend is an orchestration and abstraction layer, not a thin proxy.

Build for a real startup with real customers, real payments, real provider failures, and real data.
