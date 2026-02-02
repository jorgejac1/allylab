# AllyLab Cookie Capture Extension

A Chrome extension to easily capture cookies from authenticated sites for use with AllyLab's authenticated scanning feature.

## Features

- Capture all cookies from the current site
- Option to include subdomain cookies
- Option to capture session-only cookies
- Preview JSON output before copying
- One-click copy to clipboard in AllyLab-compatible format

## Installation

### Development Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `packages/browser-extension` folder

### Production Installation

The extension will be published to the Chrome Web Store (coming soon).

## Usage

1. Navigate to the website you want to scan (e.g., your authenticated dashboard)
2. Log in to the site
3. Click the AllyLab extension icon in your browser toolbar
4. Configure options:
   - **Include Subdomains**: Capture cookies from all subdomains (e.g., `*.example.com`)
   - **Session Only**: Only capture session cookies (no persistent cookies)
5. Click **Capture Cookies**
6. The cookies are copied to your clipboard in JSON format
7. In AllyLab Dashboard:
   - Go to **Settings** → **Authentication**
   - Create a new profile
   - Select method **Cookies**
   - Paste the captured cookies

## JSON Output Format

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

## Permissions

The extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `cookies` | Read cookies from the current site |
| `activeTab` | Access the current tab's URL |
| `clipboardWrite` | Copy cookies to clipboard |

## Icons

To generate icons for the extension, open `icons/generate.html` in a browser and download the generated icons.

## Troubleshooting

### No cookies found

- Make sure you're logged into the site
- Some sites use HttpOnly cookies that are still captured
- Try enabling "Include Subdomains" option

### Clipboard copy failed

- Ensure the browser has clipboard permissions
- Try clicking the extension icon again

### Extension not appearing

- Make sure Developer mode is enabled
- Check that the extension is enabled in chrome://extensions/
- Try reloading the extension

## Privacy

This extension:
- Only accesses cookies when you click the extension icon
- Never sends data to external servers
- All processing happens locally in your browser
- Cookies are only copied to your local clipboard

## Security Features in AllyLab

When you paste cookies into AllyLab, they benefit from additional security features:

### Credential Encryption
AllyLab can encrypt stored credentials using AES-256-GCM encryption. Enable this in Settings → Authentication by toggling "Encrypt Stored Credentials".

### Profile Health Monitoring
AllyLab tracks when profiles were last tested and warns you when credentials may need to be refreshed:
- 🟢 **Healthy**: Tested within 7 days
- 🟡 **Warning**: Not tested in 7-30 days
- 🔴 **Expired**: Not tested in 30+ days or last test failed

We recommend testing your profiles regularly, especially before important accessibility audits.

## Development

```bash
# The extension is vanilla JavaScript with no build step
# Just load the folder as an unpacked extension

# To test changes:
# 1. Make your changes to popup.html or popup.js
# 2. Go to chrome://extensions/
# 3. Click the refresh icon on the extension card
```

## License

Part of the AllyLab project.
