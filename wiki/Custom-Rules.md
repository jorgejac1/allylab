# Custom Rules

Create custom accessibility rules to extend built-in axe-core checks.

## Overview

Custom rules allow you to:
- Enforce organization-specific standards
- Check for patterns axe-core doesn't cover
- Create project-specific validations
- Share rules across teams

## Accessing Custom Rules

1. Navigate to **Settings** → **Rules** tab
2. View existing rules
3. Click **New Rule** to create

## Creating a Rule

### Basic Information

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Descriptive rule name |
| Description | No | What the rule checks for |
| Type | Yes | Selector, Attribute, Content, or Structure |
| Severity | Yes | Critical, Serious, Moderate, or Minor |

### Rule Types

#### Selector
Check if a CSS selector exists or doesn't exist.

**Example: Skip Navigation Link**
```json
{
  "name": "Skip Navigation Link",
  "type": "selector",
  "severity": "serious",
  "selector": "body > a[href^='#']:first-child, [role='navigation'] a[href^='#']:first-of-type",
  "condition": { "operator": "not-exists" },
  "message": "Add a 'Skip to main content' link at the beginning of the page"
}
```

#### Attribute
Check if elements have specific attributes.

**Example: Language Attribute**
```json
{
  "name": "Language Attribute",
  "type": "attribute",
  "severity": "serious",
  "selector": "html",
  "condition": {
    "attribute": "lang",
    "operator": "not-exists"
  },
  "message": "Add lang attribute to the html element"
}
```

#### Content
Check text content of elements.

**Example: Empty Button**
```json
{
  "name": "Empty Interactive Element",
  "type": "content",
  "severity": "critical",
  "selector": "button:empty, a:empty",
  "condition": { "operator": "exists" },
  "message": "Interactive elements must have text content or aria-label"
}
```

#### Structure
Check DOM structure relationships.

**Example: Heading Hierarchy**
```json
{
  "name": "H1 Present",
  "type": "structure",
  "severity": "moderate",
  "selector": "h1",
  "condition": { "operator": "not-exists" },
  "message": "Page should have exactly one h1 element"
}
```

### Condition Operators

| Operator | Description |
|----------|-------------|
| `exists` | Fail if selector matches |
| `not-exists` | Fail if selector doesn't match |
| `equals` | Attribute equals value |
| `not-equals` | Attribute doesn't equal value |
| `contains` | Attribute contains value |
| `matches` | Attribute matches regex pattern |

### WCAG Tags

Map rules to WCAG success criteria:

| Tag | Criterion |
|-----|-----------|
| `wcag2a` | WCAG 2.0 Level A |
| `wcag2aa` | WCAG 2.0 Level AA |
| `wcag21a` | WCAG 2.1 Level A |
| `wcag21aa` | WCAG 2.1 Level AA |
| `wcag22aa` | WCAG 2.2 Level AA |
| `wcag111` | 1.1.1 Non-text Content |
| `wcag241` | 2.4.1 Bypass Blocks |
| `wcag311` | 3.1.1 Language of Page |
| `best-practice` | Not WCAG, but recommended |

## Testing Rules

Before saving, test your rule:

1. Enter sample HTML in the test area
2. Click **Run Test**
3. View pass/fail result
4. Adjust rule if needed

**Example Test HTML:**
```html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <main>
    <h2>Welcome</h2>
    <p>Content here</p>
  </main>
</body>
</html>
```

## Import/Export

### Export Rules
1. Click **Export** button
2. JSON file downloads
3. Share with team

### Import Rules
1. Click **Import** button
2. Select JSON file
3. Rules added to list

### Export Format
```json
{
  "rules": [
    {
      "id": "rule-abc123",
      "name": "Skip Navigation Link",
      "description": "...",
      "type": "selector",
      "severity": "serious",
      "selector": "...",
      "condition": { "operator": "not-exists" },
      "message": "...",
      "helpUrl": "...",
      "wcagTags": ["wcag2a", "wcag241"],
      "enabled": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "version": "1.0"
}
```

## Best Practices

### Do
- ✅ Use specific, descriptive names
- ✅ Write clear error messages
- ✅ Map to relevant WCAG criteria
- ✅ Test thoroughly before enabling
- ✅ Document rule purpose in description

### Don't
- ❌ Create overly broad selectors
- ❌ Duplicate existing axe-core rules
- ❌ Set all rules to "critical"
- ❌ Use complex regex without testing

## Example Rules Library

### Organization Standards

**Company Logo Alt Text**
```json
{
  "name": "Company Logo Alt Text",
  "type": "attribute",
  "severity": "moderate",
  "selector": "img[src*='logo']",
  "condition": {
    "attribute": "alt",
    "operator": "not-equals",
    "value": "Company Name Logo"
  },
  "message": "Company logo should have alt text 'Company Name Logo'"
}
```

**Footer Copyright**
```json
{
  "name": "Footer Copyright Year",
  "type": "selector",
  "severity": "minor",
  "selector": "footer:contains('2024')",
  "condition": { "operator": "not-exists" },
  "message": "Footer should contain current copyright year"
}
```

### Accessibility Enhancements

**Focus Visible Styles**
```json
{
  "name": "Focus Indicator Class",
  "type": "selector",
  "severity": "serious",
  "selector": "[tabindex]:not([class*='focus'])",
  "condition": { "operator": "exists" },
  "message": "Focusable elements should have visible focus styles"
}
```

## API Reference

See [[API Reference#custom-rules]] for programmatic access.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rules` | GET | List all rules |
| `/rules` | POST | Create rule |
| `/rules/:id` | GET | Get single rule |
| `/rules/:id` | PUT | Update rule |
| `/rules/:id` | DELETE | Delete rule |
| `/rules/test` | POST | Test rule |
| `/rules/import` | POST | Import rules |
| `/rules/export` | GET | Export rules |