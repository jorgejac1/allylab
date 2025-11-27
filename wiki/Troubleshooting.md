# Troubleshooting

Solutions for common issues.

## Installation Issues

### Playwright Browser Not Found

**Error:**
```
browserType.launch: Executable doesn't exist
```

**Solution:**
```bash
npx playwright install chromium
```

### npm Install Fails

**Error:**
```
npm ERR! code ERESOLVE
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

**Error:**
```
Cannot find module '@allylab/api'
```

**Solution:**
```bash
npm run build
```

---

## Runtime Issues

### Port Already in Use

**Error:**
```
listen EADDRINUSE :::3001
```

**Solution:**
```bash
# Find process
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev:api
```

### CORS Errors

**Error:**
```
Access to fetch blocked by CORS policy
```

**Solution:**
1. Ensure API is running
2. Check API URL in dashboard settings
3. Verify CORS config in `server.ts`

### API Connection Failed

**Error:**
```
Failed to fetch
```

**Solution:**
1. Start API server: `npm run dev:api`
2. Check health: `curl http://localhost:3001/health`
3. Verify API URL in Settings → API

---

## Scanning Issues

### Timeout During Scan

**Error:**
```
Navigation timeout of 60000 ms exceeded
```

**Causes:**
- Target site is slow
- Network issues
- Complex page

**Solution:**
- Scanner automatically retries
- Try again later
- Scan simpler pages first

### No Issues Found

**Possible causes:**
- Site is accessible ✅
- Wrong URL scanned
- JavaScript-rendered content not loaded

**Solution:**
- Verify URL is correct
- Check if site uses JavaScript
- Try different viewport

### Score Seems Wrong

**Possible causes:**
- Only visible content scanned
- Hidden elements not checked
- JavaScript not executed

**Solution:**
- Review individual findings
- Check page source
- Report as bug if incorrect

---

## Integration Issues

### GitHub Connection Failed

**Error:**
```
Bad credentials
```

**Solution:**
1. Regenerate Personal Access Token
2. Ensure `repo` scope is selected
3. Re-enter token in Settings

### GitHub PR Creation Failed

**Error:**
```
Not Found
```

**Possible causes:**
- Wrong repository
- No write access
- File path incorrect

**Solution:**
1. Verify repository access
2. Check file path exists
3. Ensure correct branch selected

### JIRA Export Failed

**Error:**
```
401 Unauthorized
```

**Solution:**
1. Regenerate API token
2. Verify email is correct
3. Check JIRA permissions

### Webhook Not Received

**Possible causes:**
- Webhook URL incorrect
- Firewall blocking
- Slack/Teams permissions

**Solution:**
1. Test webhook in Settings
2. Check URL is correct
3. Verify Slack/Teams app permissions

---

## Performance Issues

### Slow Scans

**Causes:**
- Large pages
- Many resources
- Network latency

**Solutions:**
- Scan smaller sections
- Use site scan for multiple pages
- Check network connection

### Memory Issues

**Error:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**Solution:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Dashboard Slow

**Causes:**
- Too many stored scans
- Large scan results

**Solutions:**
1. Clear old scans in Settings
2. Reduce Max Scans Stored
3. Export and clear data

---

## CLI Issues

### Command Not Found

**Error:**
```
allylab: command not found
```

**Solution:**
```bash
# Install globally
npm install -g @allylab/cli

# Or use npx
npx @allylab/cli scan https://example.com
```

### API Not Reachable

**Error:**
```
Error: fetch failed
```

**Solution:**
```bash
# Start API first
npm run dev:api

# Then run CLI
allylab scan https://example.com --api-url http://localhost:3001
```

---

## Docker Issues

### Container Won't Start

**Error:**
```
Error response from daemon
```

**Solution:**
```bash
# Check logs
docker logs allylab-api

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Browser Crashes in Docker

**Error:**
```
Failed to launch browser
```

**Solution:**
Ensure Dockerfile installs browser dependencies:
```dockerfile
RUN npx playwright install --with-deps chromium
```

---

## Getting Help

1. **Check this guide** for common issues
2. **Search [GitHub Issues](https://github.com/jorgejac1/allylab/issues)**
3. **Open new issue** with:
   - Node.js version (`node -v`)
   - npm version (`npm -v`)
   - Operating system
   - Full error message
   - Steps to reproduce

---

## Debug Mode

Enable verbose logging:
```bash
# API
DEBUG=allylab:* npm run dev:api

# CLI
allylab scan https://example.com --verbose
```