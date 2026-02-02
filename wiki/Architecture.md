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
├── components/         # UI components (100+)
│   ├── alerts/             # Alert & notification components
│   ├── charts/             # Chart components (IssueChangeBadge, etc.)
│   ├── findings/           # Findings table, details, PR creation
│   │   ├── apply-fix/          # Apply fix workflow components
│   │   ├── batch-pr/           # Batch PR components
│   │   └── create-pr/          # Create PR workflow components
│   ├── reports/            # Reports & trend views
│   │   └── comparison/         # Period comparison components
│   ├── settings/           # Settings page components
│   └── ui/                 # Reusable UI primitives
├── config/             # Centralized configuration (API, storage keys, etc.)
├── context/            # React context (AppContext with providers)
├── hooks/              # Custom React hooks (25+)
├── pages/              # Page components
├── services/           # API service layer
├── types/              # TypeScript types
├── utils/              # Utilities
│   └── pdf/                # PDF export utilities
└── __tests__/          # Unit tests (1900+ tests, ~95% coverage)

e2e/                    # Playwright E2E tests (60 tests)
```

**Key Hooks:**
- `useScanSSE` - SSE streaming for real-time scans
- `useScans` - Scan history management
- `useDashboardData` - Dashboard state aggregation
- `useAsyncOperation` - Generic async operation handler
- `useDateRanges` - Date range calculations
- `useTrendData` - Trend data aggregations
- `useDrawerState` - Drawer/modal state management
- `useFindingsPagination` - Pagination for findings

**Key Context:**
- `AppContext` - Global app state with `useApp`, `useNavigation`, `useCurrentScan`, `useDrillDown` hooks

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
├── config/         # Environment & plugin configuration
│   ├── env.ts          # Environment variables with validation
│   └── swagger.ts      # OpenAPI documentation config
├── interfaces/     # Storage abstraction interfaces
│   └── storage.ts      # IStorage interface for DB migration
├── routes/         # API endpoints
│   ├── health.ts       # Health & metrics endpoints
│   ├── scan.ts         # SSE streaming scan
│   ├── scan-json.ts    # JSON response scan
│   ├── crawl.ts        # Multi-page site scanning
│   ├── fixes.ts        # AI-powered fix generation
│   ├── rules.ts        # Custom accessibility rules
│   ├── trends.ts       # Historical trend analysis
│   ├── schedules.ts    # Scheduled scans
│   ├── webhooks.ts     # Webhook notifications
│   ├── github.ts       # GitHub PR integration
│   ├── jira.ts         # JIRA issue integration
│   └── export.ts       # CSV/JSON export
├── services/       # Business logic
│   ├── scanner.ts      # axe-core scanning engine
│   ├── browser.ts      # Playwright browser pool
│   ├── crawler.ts      # Site crawling with depth control
│   ├── ai-fixes.ts     # Claude AI integration
│   ├── github.ts       # GitHub API client
│   ├── scheduler.ts    # Cron-based scan scheduling
│   └── webhooks.ts     # Webhook delivery with retries
├── types/          # TypeScript type definitions
└── utils/          # Utilities
    ├── errors.ts       # Standardized error handling
    ├── logger.ts       # Pino structured logging
    ├── metrics.ts      # Prometheus metrics
    ├── pagination.ts   # List pagination helpers
    ├── scoring.ts      # Accessibility score calculation
    ├── sse.ts          # Server-Sent Events helpers
    ├── storage.ts      # JSON file storage (implements IStorage)
    └── wcag.ts         # WCAG standards mapping
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
| Rules | JSON File | Custom rules (via IStorage) |
| Webhooks | JSON File | Webhook config (via IStorage) |
| Schedules | JSON File | Scheduled scans (via IStorage) |
| Browser Pool | Singleton | Playwright instances with pooling |
| Metrics | Memory | Prometheus counters/gauges |

**Storage Interface:**

The API uses an `IStorage<T>` interface that abstracts storage operations, enabling future migration to database backends:

```typescript
interface IStorage<T extends IEntity> {
  get(id: string): Promise<T | undefined>;
  getAll(options?: QueryOptions<T>): Promise<T[]>;
  query(options: QueryOptions<T>): Promise<QueryResult<T>>;
  set(id: string, item: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  count(filter?: (item: T) => boolean): Promise<number>;
  flush(): Promise<void>;
  close(): Promise<void>;
}
```

Current implementation: `JsonStorage` (file-based with in-memory caching and write debouncing)

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
- Rate limiting (configurable via `ENABLE_RATE_LIMITING`, `RATE_LIMIT_MAX`, `RATE_LIMIT_TIME_WINDOW`)
- Input validation with Fastify schemas
- Request ID correlation (`X-Request-ID` header)
- Standardized error responses with error codes

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

## Testing Architecture

### Unit Tests

**Technology:** Vitest, React Testing Library

**Coverage:** ~95% statement coverage, ~92% branch coverage

**Test Structure:**
```
src/__tests__/
├── components/         # Component tests
│   ├── findings/           # Findings component tests
│   ├── reports/            # Reports component tests
│   ├── settings/           # Settings component tests
│   └── ui/                 # UI component tests
├── hooks/              # Hook tests
├── context/            # Context tests
├── integration/        # Integration tests
└── services/           # Service layer tests
```

### E2E Tests

**Technology:** Playwright

**Coverage:** 60 tests covering all major workflows

**Test Files:**
```
e2e/
├── scan-workflow.spec.ts       # Scan form, options, execution
├── findings-workflow.spec.ts   # Findings table, filtering, details
├── executive-dashboard.spec.ts # KPI cards, trends, drill-down
├── benchmark-workflow.spec.ts  # Competitor management, comparison
├── settings-workflow.spec.ts   # All settings tabs, integrations
└── settings.spec.ts            # Basic settings tests
```

---

## Future Architecture

### Database Migration Path

The `IStorage` interface enables seamless migration between storage backends:

```
Phase 1 (Current): JsonStorage
├── File-based with in-memory caching
├── Write debouncing for performance
└── Suitable for single-instance deployments

Phase 2: SQLiteStorage
├── Embedded database, no external deps
├── Better query performance
└── Suitable for medium-scale deployments

Phase 3: PostgresStorage
├── Full ACID compliance
├── Connection pooling
└── Suitable for production scale
```

Migration steps:
1. Implement new storage class implementing `IStorage<T>`
2. Update storage factory to return new implementation
3. Run data migration script
4. No route/service changes required

### Multi-tenancy
```
Single instance → Tenant isolation via:
├── Request context with tenant ID
├── Storage partitioning by tenant
└── Rate limits per tenant
```

---

## Monitoring & Observability

### Prometheus Metrics

The API exposes metrics at `GET /metrics` in Prometheus format:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by method/status |
| `http_request_duration_seconds` | Histogram | Request duration distribution |
| `http_requests_in_progress` | Gauge | Currently active requests |
| `scan_duration_seconds` | Histogram | Scan execution time |
| `scan_total` | Counter | Total scans by status |
| `error_total` | Counter | Errors by type |

### Request Correlation

Every request is assigned a unique ID for tracing:
- Incoming `X-Request-ID` header is preserved
- Auto-generated if not provided: `{timestamp-base36}-{random-hex}`
- Returned in response `X-Request-ID` header
- Included in all log entries

### Structured Logging

| Level | Use |
|-------|-----|
| ERROR | Failures with stack traces |
| WARN | Degraded states, retries |
| INFO | Operations, lifecycle events |
| DEBUG | Development details |

Logs include: request ID, duration, method, path, status, and error context.

### Graceful Shutdown

The server handles `SIGINT` and `SIGTERM` signals for graceful shutdown:

1. Stop accepting new connections
2. Drain existing requests (30s timeout)
3. Shutdown scheduler (cancel pending jobs)
4. Close browser page pool
5. Close browser instance
6. Exit cleanly

### Health Check

`GET /health` returns server status and is excluded from rate limiting:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Recommended Tools

- Prometheus/Grafana (metrics visualization)
- ELK Stack or Loki (log aggregation)
- Sentry (error tracking)