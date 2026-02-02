# Authenticated Scanning

AllyLab supports scanning pages that require login, such as dashboards, admin panels, member portals, and authenticated content. This guide covers how to configure and use authentication profiles.

## Overview

Many web applications have protected pages that require authentication to access. AllyLab provides multiple authentication methods to scan these pages:

| Method | Use Case | Best For |
|--------|----------|----------|
| **Cookies** | Session cookies from browser | Most common, easy to capture |
| **HTTP Headers** | Bearer tokens, API keys | API-protected pages, SPAs |
| **Storage State** | Playwright-native format | Complex auth with localStorage |
| **Login Flow** | Automated form submission | Sites without exportable sessions |
| **Basic Auth** | HTTP Basic Authentication | Legacy systems, internal tools |

---

## Quick Start

### 1. Create an Authentication Profile

1. Go to **Settings → Authentication**
2. Click **Add Profile**
3. Enter a name and the domain(s) this profile should apply to
4. Select your authentication method
5. Configure the credentials
6. Click **Create Profile**

### 2. Test Your Profile

Before running scans, verify your credentials work:

1. Click the **Test** (play) button on your profile
2. Enter a protected URL
3. Click **Run Test**
4. Check for success confirmation

### 3. Scan with Authentication

**Dashboard:**
- The scan form auto-detects matching profiles by domain
- Or manually select a profile from the dropdown

**CLI:**
```bash
allylab scan https://dashboard.example.com --cookies cookies.json
```

**Scheduled Scans:**
- Select an auth profile when creating the schedule
- The profile will be used for all scheduled runs

---

## Authentication Methods

### Cookies

Inject session cookies into the browser before navigating to the target page.

**Format:**
```json
[
  {
    "name": "session_id",
    "value": "abc123xyz",
    "domain": ".example.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

**How to capture cookies:**
1. Log in to the site normally
2. Open DevTools → Application → Cookies
3. Copy the session cookies
4. Or use the [AllyLab Cookie Capture Extension](#browser-extension)

**Properties:**
| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Cookie name |
| `value` | Yes | Cookie value |
| `domain` | Yes | Domain (with leading dot for subdomains) |
| `path` | No | Cookie path (default: `/`) |
| `expires` | No | Expiration timestamp |
| `httpOnly` | No | HTTP-only flag |
| `secure` | No | Secure flag |
| `sameSite` | No | `Strict`, `Lax`, or `None` |

---

### HTTP Headers

Add custom headers to all requests, commonly used for Bearer tokens.

**Format:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs...",
  "X-API-Key": "your-api-key"
}
```

**Use cases:**
- OAuth 2.0 access tokens
- API keys
- Custom authentication headers
- CSRF tokens

---

### Storage State

Uses Playwright's native storage state format, which includes cookies and localStorage.

**Format:**
```json
{
  "cookies": [
    { "name": "session", "value": "...", "domain": "..." }
  ],
  "origins": [
    {
      "origin": "https://app.example.com",
      "localStorage": [
        { "name": "authToken", "value": "..." }
      ]
    }
  ]
}
```

**How to capture:**
1. Use Playwright's `context.storageState()` after logging in
2. Or export from browser DevTools

```javascript
// Playwright script to capture storage state
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://app.example.com/login');
await page.fill('#email', 'user@example.com');
await page.fill('#password', 'your-password');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard');

// Save the storage state
await context.storageState({ path: 'auth.json' });
```

---

### Login Flow

Automate the login process with a sequence of actions. AllyLab will execute these steps before navigating to the target URL.

**Configuration:**
```json
{
  "loginUrl": "https://example.com/login",
  "steps": [
    { "action": "fill", "selector": "#email", "value": "user@example.com" },
    { "action": "fill", "selector": "#password", "value": "your-password" },
    { "action": "click", "selector": "button[type='submit']" },
    { "action": "waitForNavigation" }
  ],
  "successIndicator": {
    "type": "url-contains",
    "value": "/dashboard"
  }
}
```

**Available actions:**

| Action | Properties | Description |
|--------|------------|-------------|
| `goto` | `url` | Navigate to a URL |
| `fill` | `selector`, `value` | Fill an input field |
| `click` | `selector` | Click an element |
| `wait` | `timeout` | Wait for milliseconds |
| `waitForNavigation` | — | Wait for page navigation |

**Success indicators:**

| Type | Value | Description |
|------|-------|-------------|
| `url-contains` | `/dashboard` | URL contains the string |
| `selector-exists` | `.user-menu` | Element is present on page |
| `cookie-exists` | `auth_token` | Cookie is set |

---

### Basic Auth

HTTP Basic Authentication credentials sent with every request.

**Configuration:**
```json
{
  "username": "admin",
  "password": "secure-password"
}
```

**Note:** Credentials are sent with the `Authorization: Basic <base64>` header.

---

## CLI Usage

### Cookies

```bash
# From JSON file
allylab scan https://dashboard.example.com --cookies cookies.json

# Inline JSON
allylab scan https://dashboard.example.com --cookies '[{"name":"session","value":"abc","domain":".example.com"}]'
```

### Headers

```bash
# Single header
allylab scan https://api.example.com --header "Authorization: Bearer token123"

# Multiple headers
allylab scan https://api.example.com \
  --header "Authorization: Bearer token123" \
  --header "X-API-Key: key456"
```

### Storage State

```bash
allylab scan https://app.example.com --storage-state auth.json
```

### Basic Auth

```bash
allylab scan https://admin.example.com --basic-auth admin:password
```

---

## Domain Matching

Authentication profiles are automatically matched to URLs based on domain patterns.

**Patterns:**

| Pattern | Matches |
|---------|---------|
| `example.com` | Only `example.com` |
| `*.example.com` | `app.example.com`, `api.example.com`, `example.com` |
| `app.example.com` | Only `app.example.com` |

**Multiple domains:**
```
*.americanexpress.com, global.americanexpress.com
```

---

## Import/Export Profiles

### Export

1. Go to **Settings → Authentication**
2. Click **Export**
3. Profiles are downloaded as JSON

### Import

1. Click **Import**
2. Upload JSON file or paste content
3. Choose whether to overwrite existing profiles
4. Click **Import**

**Sharing profiles:**
- Export profiles for team members
- Import on other machines
- Use in CI/CD pipelines

---

## Scheduled Scans with Auth

Scheduled scans can use authentication profiles for automated monitoring of protected pages.

1. Go to **Settings → Scheduled Scans**
2. Enter the URL and frequency
3. Select an auth profile from the dropdown
4. Click **Add Schedule**

**Note:** Only enabled profiles appear in the dropdown.

---

## Browser Extension

The AllyLab Cookie Capture extension makes it easy to extract session cookies from your browser without manually copying from DevTools.

### Features

- **One-click capture** - Copy all cookies for the current domain
- **Subdomain support** - Include cookies from all subdomains (e.g., `*.example.com`)
- **Session filtering** - Option to capture only session cookies
- **Preview mode** - See the JSON output before copying
- **AllyLab format** - Cookies are formatted for direct paste into auth profiles

### Installation

**Development Installation:**

1. Clone the AllyLab repository
2. Navigate to `packages/browser-extension`
3. Open `icons/generate.html` in a browser and download the icon files
4. Go to `chrome://extensions`
5. Enable "Developer mode" (toggle in top-right)
6. Click "Load unpacked"
7. Select the `packages/browser-extension` folder

**Chrome Web Store:** Coming soon

### Usage

1. Navigate to the site you want to scan (e.g., your dashboard)
2. **Log in** to the site as you normally would
3. Click the **AllyLab extension icon** in your toolbar
4. Configure options:
   - **Include Subdomains**: Capture cookies from `*.example.com`
   - **Session Only**: Only capture session cookies (skip persistent)
5. Click **Capture Cookies**
6. The cookies are copied to your clipboard
7. In AllyLab Dashboard:
   - Go to **Settings → Authentication**
   - Click **Add Profile**
   - Select method **Cookies**
   - Paste the captured JSON

### Output Format

The extension outputs cookies in AllyLab's expected format:

```json
[
  {
    "name": "session_id",
    "value": "abc123...",
    "domain": ".example.com",
    "path": "/",
    "expires": 1735689600,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

### Permissions

| Permission | Purpose |
|------------|---------|
| `cookies` | Read cookies from the current site |
| `activeTab` | Access the current tab's URL |
| `clipboardWrite` | Copy cookies to clipboard |

The extension only accesses cookies when you click the icon. No data is sent to external servers.

---

## Credential Encryption

AllyLab can encrypt sensitive credentials stored in your browser using AES-256-GCM encryption.

### How It Works

When encryption is enabled:
1. A unique device key is generated and stored in localStorage
2. Sensitive fields (cookies, headers, passwords, tokens) are encrypted
3. Data is decrypted only when needed for scanning
4. Encrypted data uses the format: `encrypted:v1:<iv>:<ciphertext>`

### Enabling Encryption

**Dashboard:**
1. Go to **Settings → Authentication**
2. Toggle **Encrypt Stored Credentials**
3. Existing profiles are automatically migrated

**Programmatically:**
```typescript
import { setEncryptionEnabled, migrateToEncryptedStorage } from './utils/authProfiles';

// Enable encryption
setEncryptionEnabled(true);

// Migrate existing profiles
await migrateToEncryptedStorage();
```

### What Gets Encrypted

| Field | Encrypted |
|-------|-----------|
| Cookie values | ✅ Yes |
| Header values | ✅ Yes |
| Basic auth password | ✅ Yes |
| Login flow passwords | ✅ Yes |
| Storage state | ✅ Yes |
| Profile name | ❌ No |
| Domain patterns | ❌ No |

### Security Notes

- Encryption uses Web Crypto API with AES-256-GCM
- Keys are derived using PBKDF2 with 100,000 iterations
- Each encryption uses a random 12-byte IV
- The device key is unique per browser/device
- **Important:** If you clear localStorage, encrypted profiles cannot be recovered

---

## Profile Health Monitoring

AllyLab tracks the health of your authentication profiles and warns you when credentials may need attention.

### Health Status

| Status | Badge | Meaning |
|--------|-------|---------|
| **Healthy** | 🟢 Green | Tested within last 7 days, working |
| **Warning** | 🟡 Yellow | Not tested in 7-30 days |
| **Expired** | 🔴 Red | Not tested in 30+ days or last test failed |
| **Untested** | ⚪ Gray | Never been tested |

### Viewing Profile Health

1. Go to **Settings → Authentication**
2. Each profile shows a health badge
3. Hover over the badge for details:
   - Days since last test
   - Last test result
   - Recommended action

### Automatic Warnings

AllyLab warns you when:
- A profile hasn't been tested in 7+ days
- The last test failed
- You're about to use an untested profile

### Testing Profiles

**Manual Test:**
1. Click the **Test** button on a profile
2. Enter a protected URL
3. Click **Run Test**
4. Result is saved and health status updates

**Scheduled Testing:**
- Profiles used by scheduled scans are tested automatically
- Each scheduled run updates the "last tested" timestamp

### Best Practices

- **Test weekly**: Keep profiles in "Healthy" status
- **Update promptly**: When credentials expire, update and re-test
- **Use scheduled scans**: Automated scans keep profiles active
- **Check before important scans**: Verify health before audits

---

## Security Best Practices

### Credential Storage

- Credentials are stored in your browser's localStorage
- **Enable encryption** for sensitive profiles (see [Credential Encryption](#credential-encryption))
- For production, consider:
  - Using environment variables in CI/CD
  - Rotating credentials regularly
  - Using dedicated scan accounts

### Token Expiration

- Session cookies and tokens expire
- **Profile health monitoring** warns you when credentials may need refresh
- Monitor the "Last Tested" timestamp on profiles
- Set up scheduled scans to keep profiles active

### Minimal Permissions

- Use accounts with minimal necessary permissions
- Create dedicated test accounts when possible
- Avoid using admin credentials

### CI/CD Usage

Use environment variables instead of hardcoded credentials:

```yaml
# GitHub Actions
- name: Scan with auth
  env:
    AUTH_TOKEN: ${{ secrets.ALLYLAB_AUTH_TOKEN }}
  run: |
    allylab scan ${{ env.URL }} --header "Authorization: Bearer $AUTH_TOKEN"
```

---

## Troubleshooting

### "Redirected to login page"

The credentials may be expired or invalid:
1. Re-capture cookies after logging in
2. Verify the domain pattern matches
3. Check if the site requires additional auth (2FA, CAPTCHA)

### "Login flow failed"

The automated login couldn't complete:
1. Verify selectors are correct (use browser DevTools)
2. Add wait steps if the page loads slowly
3. Check for CAPTCHA or anti-bot protection
4. Try using cookies instead

### "401 Unauthorized" or "403 Forbidden"

The server rejected the credentials:
1. Verify token hasn't expired
2. Check if IP restrictions apply
3. Confirm the account has access to the page

### Cookies Not Applying

1. Check the domain matches exactly (with/without leading dot)
2. Verify cookies aren't expired
3. Check `secure` flag matches (HTTPS only)
4. Verify `sameSite` setting allows the request

---

## API Reference

### Test Auth Endpoint

```http
POST /scan/test-auth
Content-Type: application/json

{
  "url": "https://dashboard.example.com",
  "auth": {
    "cookies": [...],
    // or "headers": {...},
    // or "loginFlow": {...},
    // or "basicAuth": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful! Page accessed with provided credentials.",
  "statusCode": 200,
  "authenticatedContent": true
}
```

### Scan with Auth

```http
POST /scan
Content-Type: application/json

{
  "url": "https://dashboard.example.com",
  "standard": "wcag21aa",
  "auth": {
    "cookies": [
      { "name": "session", "value": "...", "domain": ".example.com" }
    ]
  }
}
```

---

## Examples

### American Express Dashboard

```json
{
  "name": "AmEx Account",
  "domains": ["*.americanexpress.com", "global.americanexpress.com"],
  "method": "cookies",
  "cookies": [
    { "name": "SMSESSION", "value": "...", "domain": ".americanexpress.com" },
    { "name": "FSESSION", "value": "...", "domain": ".americanexpress.com" }
  ]
}
```

### React SPA with JWT

```json
{
  "name": "React App",
  "domains": ["*.myapp.com"],
  "method": "storage-state",
  "storageState": {
    "cookies": [],
    "origins": [
      {
        "origin": "https://app.myapp.com",
        "localStorage": [
          { "name": "accessToken", "value": "eyJhbGciOiJIUzI1NiIs..." },
          { "name": "refreshToken", "value": "..." }
        ]
      }
    ]
  }
}
```

### Internal Admin Panel

```json
{
  "name": "Admin Panel",
  "domains": ["admin.internal.company.com"],
  "method": "login-flow",
  "loginFlow": {
    "loginUrl": "https://admin.internal.company.com/login",
    "steps": [
      { "action": "fill", "selector": "#username", "value": "admin" },
      { "action": "fill", "selector": "#password", "value": "..." },
      { "action": "click", "selector": "#login-button" },
      { "action": "wait", "timeout": 2000 },
      { "action": "waitForNavigation" }
    ],
    "successIndicator": {
      "type": "selector-exists",
      "value": ".admin-dashboard"
    }
  }
}
```
