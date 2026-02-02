# Production Setup Guide

This guide covers the configuration needed to deploy AllyLab in production with authentication, billing, and email notifications.

## Prerequisites

- Node.js 18+
- A Clerk account (authentication)
- A Stripe account (billing)
- A Resend account (email notifications)

## Environment Variables

### Website (Next.js)

Create a `.env.local` file in the `website/` directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
STRIPE_TEAM_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_TEAM_YEARLY_PRICE_ID=price_xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=AllyLab <noreply@yourdomain.com>

# URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_DASHBOARD_URL=https://app.yourdomain.com
```

### Dashboard (React SPA)

Create a `.env` file in the `packages/dashboard/` directory:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# API URLs
VITE_API_URL=https://api.yourdomain.com
VITE_WEBSITE_URL=https://yourdomain.com
```

## Clerk Setup

### 1. Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Choose your authentication methods (email, social providers, etc.)
3. Copy the publishable key and secret key

### 2. Configure Organizations

AllyLab uses Clerk Organizations for multi-tenant support:

1. Enable Organizations in the Clerk Dashboard → Organizations
2. Create organization roles to match AllyLab roles:
   - `admin` - Full access
   - `manager` - Manage scans and team
   - `developer` - Run scans and create fixes
   - `viewer` - Read-only access
   - `compliance` - Reports and auditing

### 3. Configure Webhooks (Optional)

For real-time sync of user/org changes:

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `organization.created`, `organization.updated`, `organizationMembership.*`

## Stripe Setup

### 1. Create Products and Prices

Create products in Stripe Dashboard for each plan:

**Pro Plan**
- Monthly: $49/month
- Yearly: $490/year (save ~17%)

**Team Plan**
- Monthly: $149/month
- Yearly: $1,490/year (save ~17%)

### 2. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3. Configure Customer Portal

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Enable the portal and configure allowed actions:
   - Update payment methods
   - View invoices
   - Cancel subscription

## Resend Email Setup

### 1. Configure Domain

1. Go to [resend.com](https://resend.com) and create an account
2. Add and verify your domain
3. Copy the API key

### 2. Email Templates

AllyLab sends the following transactional emails:
- Welcome email (on signup)
- Subscription confirmation
- Payment failed notification
- Subscription canceled
- Trial ending reminder

The email templates are defined in `website/src/lib/email/index.ts`.

## Deployment

### Vercel (Recommended for Next.js)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel Dashboard
3. Deploy

### Docker

```dockerfile
# website/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment

```bash
# Build website
cd website
npm install
npm run build
npm start

# Build dashboard
cd packages/dashboard
npm install
npm run build
# Serve dist/ with nginx or similar
```

## Development Mode

For local development without external services, AllyLab supports a mock authentication mode:

1. Don't set `VITE_CLERK_PUBLISHABLE_KEY` in the dashboard
2. Don't set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the website
3. The app will automatically use mock authentication with demo data

Mock mode features:
- Pre-configured demo users with different roles
- Simulated billing (no actual charges)
- Local storage persistence
- All features available for testing

## Security Checklist

- [ ] All API keys are stored as environment variables (never committed)
- [ ] Stripe webhook signature verification is enabled
- [ ] Clerk webhook signature verification is enabled
- [ ] HTTPS is enforced on all endpoints
- [ ] CORS is configured correctly for the dashboard domain
- [ ] Rate limiting is configured for API endpoints
- [ ] Content Security Policy headers are set

## Troubleshooting

### Authentication Issues

**"Clerk not configured" error**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Check the key starts with `pk_live_` for production

**Users can't access organization**
- Ensure the user has been invited to the organization
- Check organization membership in Clerk Dashboard

### Billing Issues

**Webhook errors**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint is publicly accessible
- Review webhook logs in Stripe Dashboard

**Subscription not updating**
- Ensure `organizationId` is set in Stripe subscription metadata
- Check Clerk organization metadata for subscription info

### Email Issues

**Emails not sending**
- Verify `RESEND_API_KEY` is correct
- Check domain verification in Resend Dashboard
- Review Resend logs for delivery issues

## Support

For additional help:
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [AllyLab GitHub Issues](https://github.com/yourusername/allylab/issues)
