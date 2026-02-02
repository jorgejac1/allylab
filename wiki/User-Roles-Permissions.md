# User Roles & Permissions

This document outlines AllyLab's pricing tiers, user types, and role-based access control system.

---

## Pricing Tiers & Feature Access

| Feature | Free | Pro ($49/mo) | Team ($149/mo) | Enterprise |
|---------|------|--------------|----------------|------------|
| **Scans** | 100/mo | Unlimited | Unlimited | Unlimited |
| **Team Members** | 1 | 5 | 20 | Unlimited |
| **AI Fix Suggestions** | 10/mo | Unlimited | Unlimited | Unlimited |
| **GitHub PRs** | 5/mo | Unlimited | Unlimited | Unlimited |
| **Scheduled Scans** | - | Daily | Hourly | Custom |
| **Custom Rules** | - | 10 rules | Unlimited | Unlimited |
| **JIRA Integration** | - | Yes | Yes | Yes |
| **API Access** | - | 1,000 req/hr | 5,000 req/hr | Custom |
| **SSO/SAML** | - | - | - | Yes |
| **Self-hosted** | - | - | - | Yes |
| **Audit Logs** | - | - | - | Yes |
| **Export Formats** | CSV | PDF, CSV, Excel | All | All |
| **Support** | Community | Priority Email | Priority + Slack | Dedicated AM |

### Feature Limits by Tier

#### Free Tier
- 100 scans per month
- 10 AI fix suggestions per month
- 5 GitHub PR creations per month
- CSV export only
- Single user (no team)
- Community support

#### Pro Tier ($49/month)
- Unlimited scans
- Unlimited AI fixes
- Unlimited GitHub PRs
- Daily scheduled scans
- Up to 10 custom rules
- 5 team members
- JIRA integration
- Slack/Teams notifications
- API access (1,000 requests/hour)
- PDF, CSV, Excel exports

#### Team Tier ($149/month)
- Everything in Pro
- Hourly scheduled scans
- Unlimited custom rules
- 20 team members
- API access (5,000 requests/hour)
- Priority support with Slack channel

#### Enterprise (Custom Pricing)
- Everything in Team
- Unlimited team members
- SSO/SAML authentication
- Self-hosted deployment option
- Custom API rate limits
- Dedicated account manager
- SLA guarantee
- Security review
- Custom integrations
- On-site training
- Audit logs
- VPAT documentation

---

## User Types by Organization Size

### 1. Solo Developer / Freelancer

**Typical Tier:** Free or Pro

| Characteristic | Description |
|----------------|-------------|
| **Team Size** | 1 person |
| **Primary Tool** | CLI for local development |
| **Key Needs** | Quick scans, AI fix suggestions |
| **Pain Points** | Limited time, needs fast results |
| **Value Prop** | Automated fixes save hours |

**Typical Workflow:**
1. Run `allylab scan` during development
2. Review issues in terminal
3. Apply AI fixes directly
4. Commit and move on

---

### 2. Startup / Small Team

**Typical Tier:** Pro

| Characteristic | Description |
|----------------|-------------|
| **Team Size** | 5-10 people |
| **Users** | 1-2 developers, 1 PM/founder |
| **Primary Tool** | Dashboard + CLI |
| **Key Needs** | Team visibility, basic reporting |
| **Pain Points** | Limited budget, compliance pressure |
| **Value Prop** | Affordable compliance, GitHub integration |

**Typical Workflow:**
1. Developers run scans via CLI or dashboard
2. PM reviews weekly accessibility reports
3. Issues assigned via JIRA integration
4. PRs created for quick fixes

---

### 3. Mid-size Company

**Typical Tier:** Team

| Characteristic | Description |
|----------------|-------------|
| **Team Size** | 20-100 people |
| **Users** | Multiple dev teams, QA, PM, compliance |
| **Primary Tool** | Dashboard (primary), CLI (developers) |
| **Key Needs** | Multi-site management, trends, automation |
| **Pain Points** | Multiple properties, audit requirements |
| **Value Prop** | Centralized management, scheduled scans |

**Typical Workflow:**
1. Scheduled scans run automatically
2. Notifications sent to Slack on new issues
3. Engineering manager reviews trends
4. Compliance officer exports PDF reports
5. Developers fix issues via batch PRs

---

### 4. Enterprise

**Typical Tier:** Enterprise

| Characteristic | Description |
|----------------|-------------|
| **Team Size** | 100+ people |
| **Users** | Multiple departments, executives |
| **Primary Tool** | Dashboard with SSO |
| **Key Needs** | Security, compliance, audit trails |
| **Pain Points** | Regulatory requirements, data control |
| **Value Prop** | Self-hosted, SSO, VPAT, audit logs |

**Typical Workflow:**
1. SSO login enforced
2. Role-based access controls
3. Automated scans with SLA monitoring
4. Executive dashboard for leadership
5. Audit logs for compliance
6. VPAT documentation for legal

---

## Role Definitions

AllyLab supports the following user roles:

### Admin
- **Description:** Full system access, manages organization
- **Typical User:** CTO, Engineering Director, IT Admin
- **Permissions:** All features + user management + billing

### Manager
- **Description:** Team oversight, no code-level access
- **Typical User:** Engineering Manager, PM, VP Engineering
- **Permissions:** Executive dashboard, reports, trends, team metrics

### Developer
- **Description:** Day-to-day scanning and fixing
- **Typical User:** Frontend Developer, Full-stack Developer
- **Permissions:** Scan, findings, AI fixes, GitHub PR creation

### Viewer
- **Description:** Read-only access for stakeholders
- **Typical User:** Product Owner, Designer, Executive
- **Permissions:** View findings and reports (no actions)

### Compliance
- **Description:** Audit and reporting focused
- **Typical User:** Compliance Officer, Legal, QA Lead
- **Permissions:** Reports, exports, audit logs (no code features)

---

## Feature Visibility by Role

### Navigation & Pages

| Page/Feature | Admin | Manager | Developer | Viewer | Compliance |
|--------------|-------|---------|-----------|--------|------------|
| Scan Page | Yes | Yes | Yes | No | No |
| Findings List | Yes | Yes | Yes | Yes | Yes |
| Finding Details | Yes | Yes | Yes | Yes | Yes |
| Executive Dashboard | Yes | Yes | No | Yes | Yes |
| Trends & Analytics | Yes | Yes | Yes | Yes | Yes |
| Reports | Yes | Yes | Yes | Yes | Yes |
| Competitor Benchmark | Yes | Yes | No | Yes | Yes |
| Custom Rules | Yes | Yes | Yes | No | No |
| Schedules | Yes | Yes | Yes | No | No |
| Settings | Yes | Limited | Limited | No | No |
| User Management | Yes | No | No | No | No |
| Billing | Yes | No | No | No | No |
| Audit Logs | Yes | Yes | No | No | Yes |

### Actions & Operations

| Action | Admin | Manager | Developer | Viewer | Compliance |
|--------|-------|---------|-----------|--------|------------|
| Run Scan | Yes | Yes | Yes | No | No |
| Generate AI Fix | Yes | No | Yes | No | No |
| Create GitHub PR | Yes | No | Yes | No | No |
| Create Batch PR | Yes | No | Yes | No | No |
| Mark False Positive | Yes | Yes | Yes | No | No |
| Verify Fix | Yes | Yes | Yes | No | No |
| Export PDF | Yes | Yes | Yes | Yes | Yes |
| Export CSV/Excel | Yes | Yes | Yes | Yes | Yes |
| Create Custom Rule | Yes | Yes | Yes | No | No |
| Manage Schedule | Yes | Yes | Yes | No | No |
| Configure Webhooks | Yes | Yes | No | No | No |
| Connect GitHub | Yes | No | Yes | No | No |
| Connect JIRA | Yes | Yes | No | No | Yes |
| Invite Users | Yes | No | No | No | No |
| Change Roles | Yes | No | No | No | No |
| Manage Billing | Yes | No | No | No | No |
| View Audit Logs | Yes | Yes | No | No | Yes |

---

## Role Assignment Guidelines

### Default Role for New Users
- **Recommended:** `viewer` (safest default)
- **Alternative:** `developer` (if team is dev-focused)

### Role Assignment by Job Title

| Job Title | Recommended Role |
|-----------|------------------|
| CEO / CTO / VP | manager |
| Engineering Manager | manager |
| Product Manager | viewer |
| Tech Lead | developer |
| Senior Developer | developer |
| Junior Developer | developer |
| QA Engineer | developer or viewer |
| Designer | viewer |
| Compliance Officer | compliance |
| Legal Counsel | compliance |
| External Auditor | compliance (temporary) |

---

## Enterprise SSO Integration

For Enterprise customers using SSO/SAML:

### SAML Group Mapping

| SAML Group | AllyLab Role |
|------------|--------------|
| `allylab-admins` | admin |
| `allylab-managers` | manager |
| `allylab-developers` | developer |
| `allylab-viewers` | viewer |
| `allylab-compliance` | compliance |

### Auto-provisioning
- Users created on first SSO login
- Role assigned based on SAML group membership
- Users removed when deprovisioned from IdP

---

## Implementation Considerations

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP
);

-- Audit logs table (Enterprise only)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Middleware

```typescript
// Role-based authorization middleware
const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.post('/api/scan', requireRole('admin', 'manager', 'developer'), scanHandler);
app.get('/api/audit-logs', requireRole('admin', 'manager', 'compliance'), auditHandler);
app.post('/api/users/invite', requireRole('admin'), inviteHandler);
```

### Frontend Route Guards

```typescript
// Route configuration with role requirements
const routes = [
  { path: '/scan', roles: ['admin', 'manager', 'developer'] },
  { path: '/findings', roles: ['admin', 'manager', 'developer', 'viewer', 'compliance'] },
  { path: '/executive', roles: ['admin', 'manager', 'viewer', 'compliance'] },
  { path: '/settings/users', roles: ['admin'] },
  { path: '/settings/billing', roles: ['admin'] },
];

// Sidebar filtering based on role
const filterSidebarItems = (items: MenuItem[], userRole: Role): MenuItem[] => {
  return items.filter(item => item.roles.includes(userRole));
};
```

---

## Pricing Page Reference

For current pricing details, see:
- Website: `/pricing` page
- Source: `website/src/app/pricing/page.tsx`

## Related Documentation

- [[Features]] - Complete feature list
- [[API Reference]] - API documentation
- [[Architecture]] - System design
- [[Integrations]] - GitHub, JIRA, Slack setup
