# Authentication Setup Guide

AllyLab uses **Clerk** for authentication and **Stripe** for subscription billing. This guide explains how to set up the complete auth flow.

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    Website      │      │      API        │      │   Dashboard     │
│   (Next.js)     │      │   (Fastify)     │      │    (React)      │
│                 │      │                 │      │                 │
│  - Sign up/in   │◄────►│  - Validate     │◄────►│  - Protected    │
│  - Stripe       │      │    tokens       │      │    routes       │
│    checkout     │      │  - User data    │      │  - Role-based   │
│  - Billing      │      │  - Permissions  │      │    access       │
│    portal       │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Clerk                                      │
│   - User authentication        - Organization management             │
│   - Session management         - User metadata (roles, org)          │
│   - SSO (Enterprise)           - JWT tokens                          │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Stripe                                      │
│   - Subscription management    - Payment processing                  │
│   - Billing portal            - Webhook events                       │
│   - Invoices                  - Trial periods                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1. Create Clerk Account

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Enable the following authentication methods:
   - Email/Password
   - Google OAuth
   - GitHub OAuth (optional)
4. Enable **Organizations** in Clerk settings
5. Copy your API keys:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 2. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Create products and prices for each plan:

   **Pro Plan ($49/month)**
   - Product: "AllyLab Pro"
   - Monthly price: `price_pro_monthly`
   - Yearly price: `price_pro_yearly` (with discount)

   **Team Plan ($149/month)**
   - Product: "AllyLab Team"
   - Monthly price: `price_team_monthly`
   - Yearly price: `price_team_yearly` (with discount)

3. Copy your API keys:
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
4. Set up webhook endpoint (see below)

### 3. Configure Environment Variables

#### Website (.env.local)

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...

# URLs
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:5173
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### API (.env)

```env
# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Other settings...
```

#### Dashboard (.env)

```env
# Clerk (optional - enables production auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# API URL
VITE_API_URL=http://localhost:3001

# Website URL (for redirects)
VITE_WEBSITE_URL=http://localhost:3000

# Development mode (uses mock auth when true)
VITE_USE_MOCK_AUTH=true
```

### 4. Set Up Stripe Webhooks

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (`STRIPE_WEBHOOK_SECRET`)

For local development, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Configure Clerk Organization Settings

In Clerk Dashboard:

1. Go to Organizations settings
2. Enable organizations
3. Configure roles:
   - `org:admin` - Full access
   - `org:member` - Standard member

We use Clerk's organization feature combined with custom metadata for our 5-role system:
- Admin, Manager → `org:admin`
- Developer, Viewer, Compliance → `org:member`

Custom roles are stored in user's `publicMetadata.role`.

## Authentication Flow

### Sign Up

1. User visits website `/sign-up`
2. Clerk handles authentication
3. On success, redirect to `/onboarding`
4. User selects plan and creates organization
5. If paid plan, redirect to Stripe Checkout
6. Stripe webhook updates organization metadata
7. Redirect to dashboard

### Sign In

1. User visits website `/sign-in`
2. Clerk handles authentication
3. On success, redirect to dashboard
4. Dashboard fetches user data from API
5. API validates Clerk token and returns user + org data

### Billing Portal

1. User clicks "Manage Billing" in dashboard
2. API creates Stripe Billing Portal session
3. User redirected to Stripe portal
4. User manages subscription
5. Stripe webhooks update organization metadata

## Development Mode

For development without Clerk/Stripe:

```env
# Dashboard .env
VITE_USE_MOCK_AUTH=true
```

This enables:
- Mock users (Admin, Manager, Developer, Viewer, Compliance)
- User switcher dropdown in sidebar
- All features work without external services

### Mock Authentication Flow

In development mode, a localStorage-based mock auth system provides a seamless experience between the website and dashboard:

```
┌─────────────────┐                    ┌─────────────────┐
│    Website      │                    │   Dashboard     │
│   (Next.js)     │                    │    (React)      │
│                 │                    │                 │
│  /sign-in       │───────────────────►│  Checks for     │
│  /sign-up       │   localStorage     │  website        │
│                 │   'allylab_session'│  session        │
└─────────────────┘                    └─────────────────┘
```

**How it works:**

1. **Website Login**: User signs in at `/sign-in` on the website
2. **Session Created**: A session is stored in `localStorage` with key `allylab_session`
3. **Dashboard Access**: When the dashboard loads, it checks for this session
4. **Session Shared**: If found, the dashboard uses that user without showing the switcher
5. **Direct Access**: If no session, the dashboard shows the user switcher dropdown

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | admin123 | Admin |
| manager@acme.com | manager123 | Manager |
| dev@acme.com | dev123 | Developer |
| viewer@acme.com | viewer123 | Viewer |
| compliance@acme.com | compliance123 | Compliance |

### User Switcher Behavior

| Access Method | UI Behavior |
|---------------|-------------|
| Via website login | User menu with logout only |
| Direct dashboard access | Full user switcher dropdown |

### Cross-Tab Synchronization

Both website and dashboard listen for `storage` events, enabling:
- Login in one tab updates all tabs
- Logout clears session everywhere
- Role changes sync across tabs

### Mock Auth Files

| Package | File | Purpose |
|---------|------|---------|
| website | `src/lib/auth/mock.ts` | Core mock utilities |
| website | `src/lib/auth/MockAuthContext.tsx` | React context provider |
| dashboard | `src/data/mockAuth.ts` | Website session integration |
| dashboard | `src/contexts/AuthContext.tsx` | Auth context with session check |

## User Roles

| Role | Description | Dashboard Access |
|------|-------------|-----------------|
| Admin | Full access, can manage users and billing | All pages |
| Manager | Can run scans and manage integrations | All except billing |
| Developer | Can run scans and create fixes | Scan, Reports, Settings |
| Viewer | Read-only access | Scan history, Reports |
| Compliance | Focus on reports and auditing | Reports, Executive, Benchmark |

## Subscription Plans

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| Scans/month | 10 | 100 | 500 | Unlimited |
| Pages/scan | 5 | 25 | 100 | Unlimited |
| Users | 1 | 1 | 10 | Unlimited |
| Scheduled scans | ❌ | ✅ | ✅ | ✅ |
| Custom rules | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ✅ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| SSO | ❌ | ❌ | ❌ | ✅ |

## Troubleshooting

### "User switching only available in development"

The dashboard is running in production mode. Set `VITE_USE_MOCK_AUTH=true` or configure Clerk.

### "Invalid or expired session"

The Clerk session token has expired or is invalid. Clear cookies and sign in again.

### "Webhook signature verification failed"

Make sure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint in Stripe Dashboard.

### "No organization found"

User hasn't been added to an organization yet. This happens after signup before onboarding completes.

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Validate all tokens** server-side
3. **Use HTTPS** in production
4. **Set secure cookie options** for session tokens
5. **Implement rate limiting** for auth endpoints
6. **Log authentication events** for audit trails
