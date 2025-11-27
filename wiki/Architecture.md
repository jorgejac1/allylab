# Architecture

Technical architecture and design of AllyLab.

## System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         AllyLab                                 |
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  Dashboard  │────▶│     API     │────▶│   Scanner   │        │
│  │   (React)   │     │  (Fastify)  │     │ (Playwright)│        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│         │                   │                   │               │
│         │                   │                   ▼               │
│         │                   │           ┌─────────────┐         │
│         │                   │           │   axe-core  │         │
│         │                   │           └─────────────┘         │
│         │                   │                                   │
│         │                   ▼                                   │
│         │           ┌─────────────┐                             │
│         │           │   Claude    │                             │
│         │           │     AI      │                             │
│         │           └─────────────┘                             │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │ LocalStorage│     │   GitHub    │     │    JIRA     │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Dashboard (Frontend)

**Technology:** React 19, TypeScript, Vite

**Responsibilities:**
- User interface
- Scan management
- Result visualization
- Settings management
- Local data storage

**Key Directories:**
```
src/
├── components/     # UI components
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── types/          # TypeScript types
└── utils/          # Utilities
```

### API (Backend)

**Technology:** Fastify, Node.js, TypeScript

**Responsibilities:**
- HTTP endpoints
- Scan orchestration
- Browser management
- External integrations
- AI fix generation

**Key Directories:**
```
src/
├── routes/         # API endpoints
├── services/       # Business logic
├── types/          # TypeScript types
└── utils/          # Utilities
```

### Scanner Engine

**Technology:** Playwright, axe-core

**Responsibilities:**
- Browser automation
- Page rendering
- Accessibility testing
- Result aggregation

**Flow:**
```
Request → Browser Launch → Navigate → Render → axe-core → Results
```

### CLI

**Technology:** Commander.js, Node.js

**Responsibilities:**
- Command-line interface
- CI/CD integration
- Scripting support

---

## Data Flow

### Scan Flow
```
1. User enters URL in Dashboard
2. Dashboard sends POST /scan to API
3. API launches Playwright browser
4. Browser navigates to URL
5. axe-core injects and runs
6. Results stream via SSE
7. Dashboard displays results
8. Results saved to LocalStorage
```

### AI Fix Flow
```
1. User clicks "Generate Fix"
2. Dashboard sends POST /fixes/generate
3. API calls Claude AI with context
4. Claude returns fix suggestion
5. Dashboard displays fix preview
6. User reviews and applies
```

### GitHub PR Flow
```
1. User clicks "Create PR"
2. Dashboard sends POST /github/pr
3. API creates branch
4. API commits changes
5. API creates pull request
6. Dashboard shows PR link
```

---

## State Management

### Dashboard State

| Type | Storage | Purpose |
|------|---------|---------|
| UI State | React State | Component state |
| Scan Data | LocalStorage | Persistence |
| Settings | LocalStorage | Configuration |
| API Cache | React Query | Performance |

### API State

| Type | Storage | Purpose |
|------|---------|---------|
| Sessions | Memory | GitHub tokens |
| Rules | Memory | Custom rules |
| Webhooks | Memory | Webhook config |
| Browser | Singleton | Playwright instance |

---

## Security

### Authentication

- GitHub: Personal Access Token (stored client-side)
- JIRA: API Token (stored server-side)
- API: No auth required (self-hosted)

### Data Privacy

- Scans stored locally
- No data sent to external servers (except AI/GitHub/JIRA)
- PII not collected

### Best Practices

- HTTPS for production
- Token encryption at rest
- Rate limiting for production
- Input validation

---

## Scalability

### Horizontal Scaling
```
┌─────────────┐
│   Nginx     │
│ Load Balancer│
└──────┬──────┘
       │
┌──────┴──────┐
│             │
▼             ▼
┌─────────┐ ┌─────────┐
│  API 1  │ │  API 2  │
└─────────┘ └─────────┘
```

### Considerations

| Component | Scaling Strategy |
|-----------|-----------------|
| Dashboard | CDN/Static hosting |
| API | Multiple instances |
| Browser | Pool management |
| Storage | Database migration |

---

## Technology Decisions

### Why Fastify?

- Fast performance
- TypeScript support
- Plugin ecosystem
- Low overhead

### Why Playwright?

- Multi-browser support
- Modern API
- Auto-wait functionality
- Good TypeScript support

### Why axe-core?

- Industry standard
- Comprehensive rules
- Active maintenance
- WCAG coverage

### Why React 19?

- Component model
- Large ecosystem
- TypeScript support
- Team familiarity

### Why LocalStorage?

- Simple setup
- No database needed
- Client-side storage
- Sufficient for MVP

---

## Future Architecture

### Database Migration
```
LocalStorage
```

### Multi-tenancy
```
Single instance → Tenant isolation
```

---

## Monitoring

### Metrics

| Metric | Purpose |
|--------|---------|
| Scan duration | Performance |
| Error rate | Reliability |
| API latency | Performance |
| Active scans | Capacity |

### Logging

| Level | Use |
|-------|-----|
| ERROR | Failures |
| WARN | Degraded |
| INFO | Operations |
| DEBUG | Development |

### Recommended Tools

- Prometheus/Grafana (metrics)
- ELK Stack (logs)
- Sentry (errors)