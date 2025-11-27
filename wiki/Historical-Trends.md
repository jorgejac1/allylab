# Historical Trends

Track accessibility improvements over time with historical trend analysis.

## Overview

Historical Trends provides:
- Score progression visualization
- Issue count trends by severity
- Period-over-period comparison
- Projected improvement metrics

## Accessing Trends

Trends data is calculated from your scan history:

1. **Dashboard** - View trends on Executive Dashboard
2. **Reports** - Detailed trend analysis in Reports page
3. **API** - Programmatic access via Trends API

## Trend Types

### Score Trends

Track overall accessibility score over time:

- **Average Score** - Mean score across period
- **Min/Max Score** - Range of scores
- **Score Improvement** - Change from first to last scan
- **Percentiles** - p25, p50, p75, p90 distribution

### Issue Trends

Track issues by severity:

| Metric | Description |
|--------|-------------|
| Critical | Blocker issues count |
| Serious | Major issues count |
| Moderate | Medium issues count |
| Minor | Low priority count |
| Total | Sum of all issues |

### Change Rates

Velocity metrics per scan:

| Metric | Description |
|--------|-------------|
| Score Change | Points gained/lost per scan |
| Issue Change | Issues fixed/added per scan |
| Critical Change | Critical issues change per scan |
| Projected Scans | Scans needed to reach score 90 |

## Period Comparison

Compare two time periods to measure progress:

### Example
- **Period 1**: January 2024
- **Period 2**: February 2024

### Comparison Metrics
```
Score:    75 → 85 (+10, +13.3%)
Issues:   20 → 12 (-8, -40%)
Critical:  2 →  0 (-2)
Serious:   5 →  3 (-2)
```

## Using the API

### Get Score Trends
```bash
curl -X POST http://localhost:3001/trends \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [...],
    "url": "https://example.com",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "limit": 50
  }'
```

### Get Issue Trends
```bash
curl -X POST http://localhost:3001/trends/issues \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [...]
  }'
```

### Compare Periods
```bash
curl -X POST http://localhost:3001/trends/compare \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [...],
    "period1Start": "2024-01-01",
    "period1End": "2024-01-31",
    "period2Start": "2024-02-01",
    "period2End": "2024-02-28"
  }'
```

### Get Statistics
```bash
curl -X POST http://localhost:3001/trends/stats \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [...]
  }'
```

## Response Format

### Trends Response
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2024-01-01T00:00:00.000Z",
        "score": 75,
        "totalIssues": 20,
        "critical": 2,
        "serious": 5,
        "moderate": 8,
        "minor": 5
      }
    ],
    "stats": {
      "avgScore": 78,
      "minScore": 75,
      "maxScore": 85,
      "avgIssues": 17,
      "scoreImprovement": 10
    },
    "meta": {
      "totalScans": 10,
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      }
    }
  }
}
```

### Statistics Response
```json
{
  "success": true,
  "data": {
    "stats": { ... },
    "percentiles": {
      "p25": 72,
      "p50": 78,
      "p75": 85,
      "p90": 90
    },
    "changeRates": {
      "scoreChangePerScan": 1.5,
      "issueChangePerScan": -1.2,
      "projectedScansToGoal": 8
    },
    "bestScan": {
      "date": "2024-01-20",
      "score": 92,
      "url": "https://example.com"
    },
    "worstScan": {
      "date": "2024-01-05",
      "score": 65,
      "url": "https://example.com"
    }
  }
}
```

## Dashboard Visualization

### Trend Charts

The Executive Dashboard displays:

1. **Line Chart** - Score over time
2. **Stacked Area** - Issues by severity
3. **Comparison Bars** - Period comparison
4. **Sparklines** - Mini trends in KPI cards

### KPI Cards

| KPI | Description |
|-----|-------------|
| Total Scans | Number of scans in period |
| Average Score | Mean accessibility score |
| Issues Fixed | Net issues resolved |
| Best Score | Highest score achieved |

## Best Practices

### Scanning Frequency

| Use Case | Recommended Frequency |
|----------|----------------------|
| Active Development | Daily |
| Production Monitoring | Weekly |
| Compliance Audits | Monthly |

### Tracking Tips

1. **Consistent URLs** - Use same URL format for accurate tracking
2. **Regular Scans** - Schedule consistent scan intervals
3. **Baseline First** - Establish baseline before improvements
4. **Document Changes** - Note when fixes are deployed

### Goal Setting

| Current Score | Target | Timeline |
|---------------|--------|----------|
| < 50 | 70 | 3 months |
| 50-70 | 80 | 2 months |
| 70-85 | 90 | 1 month |
| 85+ | 95 | Ongoing |

## Related

- [[Features#analytics--reporting]]
- [[API Reference#historical-trends]]
- [[CI/CD Integration]]