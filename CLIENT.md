# CLIENT-SIDE BUILD SPEC — BUSINESS EMAIL STARTUP

## 0. Role

You are the lead frontend engineer and product designer for a startup that sells professional business email to Nigerian SMEs.

Build a production-quality TypeScript frontend. Do not create a generic SaaS template. The product should feel like a credible Nigerian business-infrastructure company: clean, fast, technical, trustworthy, simple, and commercially serious.

The frontend is a separate application from the backend.

---

## 1. Product Concept

The startup lets businesses:

- buy/register or connect a domain
- purchase professional business email plans
- create and manage mailboxes
- configure aliases and forwarding
- see mailbox usage
- manage domains
- manage subscriptions and billing
- complete domain/DNS setup
- receive clear setup instructions
- eventually migrate existing business email into the platform

The underlying email infrastructure will initially be provided by a third-party email infrastructure/reseller provider such as MXroute. The frontend MUST NOT expose provider-specific implementation details to customers.

The customer should think:

> "This is my business email provider."

Not:

> "This is a wrapper around another email company."

---

# 2. Primary Goal

Create a frontend that makes this flow extremely easy:

1. Discover product
2. Compare plans
3. Choose a plan
4. Create account
5. Add/connect domain
6. Pay
7. Configure/verify DNS
8. Create mailbox
9. Use/manage business email

The UI should make complicated infrastructure feel simple.

---

# 3. Technology

Use:

- TypeScript
- React
- Next.js App Router
- Tailwind CSS
- Accessible semantic HTML
- React Hook Form where forms are substantial
- Zod for client-side validation where appropriate
- TanStack Query for server state if the project architecture benefits from it
- Lucide icons or another clean icon library
- No unnecessary UI framework dependency if Tailwind/components can handle it

Use strict TypeScript.

Avoid `any`.

Use reusable components.

Keep business logic out of presentational components.

---

# 4. Visual Identity

## Core colors

Use these exact colors:

- Primary dark: `#333333`
- Secondary text/neutral: `#6B7280`
- White: `#FFFFFF`
- Accent/ambient green: `#16FF00`

The green is an AMBIANCE color, not a color to flood the interface with.

### Color philosophy

The visual system should primarily be:

- white
- dark charcoal
- gray
- subtle borders
- very restrained neon green

The green should communicate:

- active
- verified
- connected
- success
- technology
- momentum
- important CTA emphasis

Do NOT make the entire site neon green.

Do NOT use gradients that look like a generic AI startup.

Do NOT use excessive glassmorphism.

Do NOT use excessive rounded cards.

Do NOT make it look like a crypto website.

Do NOT make it look like an AI-generated SaaS template.

---

# 5. Design Direction

Desired feeling:

> "Modern Nigerian infrastructure startup."

Think:

- Stripe-level clarity
- Linear-level precision
- modern developer tooling
- premium Nigerian tech startup
- trustworthy business software

The interface should feel engineered rather than decorative.

Use generous whitespace.

Use strong typography hierarchy.

Use subtle 1px borders.

Use restrained shadows.

Use small green highlights.

Use micro-interactions sparingly.

---

# 6. Typography

Use a modern sans-serif.

Preferred:

- Inter
- Geist
- system sans-serif fallback

Typography should be:

- bold but not oversized everywhere
- readable
- compact in dashboards
- highly legible for pricing and forms

Headings should communicate confidence.

Avoid huge marketing headlines that consume half the screen.

---

# 7. Website Structure

Create the following public pages.

## `/`

Homepage.

Sections:

### Hero

Headline concept:

> Professional email for businesses that mean business.

Supporting copy:

> Get reliable email at your own domain without paying for an entire office suite.

Primary CTA:

> Get started

Secondary CTA:

> View plans

Show a subtle product UI mockup beside/below the hero.

Example:

```text
yourcompany.ng

✓ Domain connected

info@yourcompany.ng
sales@yourcompany.ng
admin@yourcompany.ng
```

The green accent should appear around the verification/status indicators.

---

### Trust / value strip

Show simple statements:

- Custom business email
- Domain setup assistance
- Secure mailboxes
- Simple management
- Nigerian-focused support

Do not fabricate customer logos.

If there are no real customers yet, do not display fake logos.

---

### How it works

Three or four steps:

1. Choose your plan
2. Connect your domain
3. Create your mailboxes
4. Start sending and receiving

---

### Product features

Explain:

- Custom domain email
- Multiple mailboxes
- Aliases
- Forwarding
- Spam protection
- Usage monitoring
- DNS assistance
- Account management

---

### Pricing preview

Show 3 plans.

Example placeholders:

### Starter
₦15,000/year

- 1 mailbox
- 5 GB storage
- Custom domain
- Webmail
- IMAP/SMTP
- DNS setup guidance

### Business
₦30,000/year

- Up to 5 mailboxes
- 5–10 GB per mailbox
- Aliases
- Forwarding
- DNS assistance
- Priority support

### Pro
₦50,000/year

- Up to 10 mailboxes
- Larger mailbox allocation
- Migration assistance
- Priority support
- Advanced management

IMPORTANT:
These are initial product placeholders. Keep all pricing/configuration data in a single typed configuration object so the backend can eventually provide real plan data.

---

### Why us

Focus on simplicity:

> Your business email should not require an IT degree.

Explain that the platform handles the complicated setup.

---

### FAQ

Include questions:

- What is business email?
- Can I use my existing domain?
- Can I buy a domain through the platform?
- How many email addresses can I create?
- Can I use Gmail/Outlook/Apple Mail with my mailbox?
- Do you help configure DNS?
- Can I migrate from another provider?
- What happens if I cancel?

Do not make unsupported claims. Mark uncertain policies as configurable content.

---

### Final CTA

Strong but simple.

> Give your business an email address worth trusting.

CTA:

> Create your business email

---

# 8. Public Navigation

Navbar:

- Product
- Pricing
- How it works
- FAQ

Right side:

- Sign in
- Get started

Mobile navigation must be clean and accessible.

---

# 9. Authentication UI

Routes:

- `/login`
- `/register`
- `/forgot-password`
- `/verify-email`

Design:

Minimal.

No distracting marketing content.

Login form:

- email
- password
- remember session if supported
- sign in
- forgot password

Register:

- name
- business/company name
- email
- password
- confirm password
- accept terms

Do not collect unnecessary information.

---

# 10. Customer Dashboard

Authenticated routes:

- `/dashboard`
- `/dashboard/domains`
- `/dashboard/mailboxes`
- `/dashboard/mailboxes/[id]`
- `/dashboard/subscription`
- `/dashboard/billing`
- `/dashboard/settings`
- `/dashboard/support`

Dashboard overview should show:

### Account summary

- business name
- subscription
- renewal date
- account status

### Email summary

- domains
- mailboxes
- storage used
- storage available

### Setup status

Example:

```text
Domain
✓ Added

DNS
✓ MX configured
✓ SPF configured
✓ DKIM configured
⚠ DMARC recommended

Mailbox
✓ info@company.com
```

---

# 11. Domain Management

`/dashboard/domains`

Allow users to:

- add domain
- view domains
- view verification status
- open DNS instructions
- verify domain
- see DNS status
- remove domain where allowed

Domain status states:

- Pending
- Verifying
- Verified
- DNS incomplete
- Active
- Error

Use clear status badges.

Do not expose raw provider terminology unnecessarily.

---

# 12. DNS Setup UX

This is one of the most important screens.

Make DNS configuration understandable to nontechnical business owners.

Instead of dumping technical records immediately, explain:

> Your domain needs a few DNS records so your email can work correctly.

Then show each record in a copy-friendly table:

| Type | Name | Value | Status |
|---|---|---|---|
| MX | @ | provider value | ✓ |
| TXT | @ | SPF value | ✓ |
| TXT | selector | DKIM value | Pending |
| TXT | _dmarc | DMARC value | Optional/Recommended |

Include:

- Copy button
- Explain button
- Verify button
- Refresh status

Never hardcode real MXroute DNS values into the frontend.

The backend must provide them.

---

# 13. Mailbox Management

`/dashboard/mailboxes`

Display:

- email address
- domain
- plan
- storage used
- quota
- status
- created date

Actions:

- Create mailbox
- Edit quota if allowed
- Suspend if allowed
- Reset password
- Delete if allowed

Create mailbox modal/page:

```text
Email
[ sales ]

Domain
[ company.com ]

Password
[ Generate secure password ]

Storage
[ 10 GB ]

[ Create mailbox ]
```

The backend is responsible for actual provisioning.

---

# 14. Mailbox Detail

Show:

- address
- status
- storage usage
- quota
- connection details
- webmail access
- SMTP settings
- IMAP settings
- security/setup information

Do not expose secrets or provider API credentials.

Connection instructions should be customer-friendly.

Example:

> Use these settings to connect your mailbox to Outlook, Apple Mail, Thunderbird, Android, or iPhone.

---

# 15. Subscription/Billing

Show:

- current plan
- price
- billing interval
- next renewal
- payment status
- upgrade/downgrade options
- invoices

Use Nigerian Naira as the primary currency.

Format:

`₦15,000`

Never hardcode currency formatting in random components. Create a reusable formatter.

---

# 16. Onboarding

Create a guided onboarding flow.

Recommended steps:

```text
Account
  ↓
Business
  ↓
Domain
  ↓
Plan
  ↓
Payment
  ↓
DNS
  ↓
Mailbox
  ↓
Complete
```

Show progress.

Allow users to leave and continue later.

Persist onboarding state from backend.

---

# 17. Empty States

Do not show blank tables.

Example:

No domains:

> You haven't connected a domain yet.

CTA:

> Add your domain

No mailboxes:

> Your domain is ready. Create your first business email.

CTA:

> Create mailbox

---

# 18. Loading/Error States

Every async operation must have:

- loading state
- success state
- failure state
- retry action where appropriate

Never leave the user staring at a blank screen.

Use skeletons for dashboard data.

Use toast notifications for short-lived actions.

Use inline error messages for forms.

---

# 19. API Architecture

Create a typed API client.

Example:

```ts
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface Domain {
  id: string;
  name: string;
  status: "pending" | "verifying" | "verified" | "active" | "error";
}

interface Mailbox {
  id: string;
  email: string;
  domainId: string;
  quotaBytes: number;
  usedBytes: number;
  status: "active" | "suspended" | "pending";
}
```

Do not couple frontend types directly to MXroute response formats.

The frontend talks to OUR backend.

The backend talks to MXroute.

---

# 20. Security Rules

Never put these in client-side code:

- MXroute API key
- provider credentials
- payment secret keys
- webhook secrets
- database credentials
- private signing keys

Only public configuration may use `NEXT_PUBLIC_*`.

Never trust client-side authorization.

The frontend should render according to backend authorization responses.

---

# 21. Responsive Design

Must work well on:

- 360px mobile
- 390px mobile
- 768px tablet
- 1024px laptop
- 1440px desktop
- large screens

Dashboard mobile layout is especially important.

Tables should become cards or horizontally scroll only when necessary.

---

# 22. Accessibility

Implement:

- keyboard navigation
- visible focus states
- semantic labels
- accessible dialogs
- accessible dropdowns
- sufficient contrast
- screen-reader-friendly status messages
- no color-only status indicators

Green status must also have text/icon.

---

# 23. SEO

Marketing pages should include:

- metadata
- title
- description
- Open Graph
- Twitter/X card
- canonical URL
- sitemap
- robots configuration

Do not expose authenticated dashboard pages to search engines.

---

# 24. Performance

Target:

- fast first load
- minimal JavaScript on public pages
- optimized fonts
- optimized images
- lazy load noncritical UI
- avoid unnecessary client components
- server-render public marketing content where appropriate

---

# 25. Component Architecture

Suggested:

```text
src/
  app/
    (marketing)/
    (auth)/
    dashboard/
  components/
    ui/
    marketing/
    dashboard/
    forms/
    billing/
    domains/
    mailboxes/
    dns/
  lib/
    api/
    auth/
    formatting/
    validation/
    constants/
  hooks/
  types/
```

Keep reusable UI components independent from business logic.

---

# 26. Important Product Principle

Do NOT make the UI provider-centric.

Bad:

> MXroute Domain Configuration

Good:

> Connect your domain

Bad:

> MXroute Mailbox

Good:

> Business email

Bad:

> MXroute API error

Good:

> We couldn't complete that setup. Please try again.

Provider-specific implementation belongs on the server.

---

# 27. Build Quality

Before finishing:

- TypeScript must compile without errors.
- No `any`.
- No fake API success.
- No dead buttons.
- No lorem ipsum.
- No fake customer logos.
- No invented testimonials.
- No hardcoded provider secrets.
- No provider credentials in browser bundles.
- Forms must validate.
- Every navigation link must work.
- Every important action must have loading/error/success states.

If backend endpoints are not available yet, create a clean typed API layer and explicit mock adapters, clearly separated from production API code.

---

# 28. Definition of Done

The frontend is complete when a user can:

1. Visit landing page.
2. Understand the product.
3. View plans.
4. Register.
5. Log in.
6. Enter the dashboard.
7. Add a domain.
8. See DNS requirements.
9. See domain verification status.
10. Create a mailbox.
11. View mailbox usage.
12. Manage subscription.
13. View billing.
14. Manage account settings.
15. Receive clear errors and confirmations.

Build the frontend as if it will become a real SaaS company, not a portfolio project.
