// AllyLab Cookie Capture Extension

let currentDomain = '';
let allCookies = [];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {
    showStatus('error', 'Cannot access this page');
    return;
  }

  try {
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    document.getElementById('current-domain').textContent = currentDomain;

    // Fetch cookies for this domain
    await fetchCookies();
  } catch (error) {
    showStatus('error', 'Cannot read page URL');
  }

  // Event listeners
  document.getElementById('capture-btn').addEventListener('click', captureCookies);
  document.getElementById('preview-btn').addEventListener('click', togglePreview);
  document.getElementById('include-subdomains').addEventListener('change', fetchCookies);
  document.getElementById('session-only').addEventListener('change', fetchCookies);
});

// Fetch cookies for current domain
async function fetchCookies() {
  const includeSubdomains = document.getElementById('include-subdomains').checked;
  const sessionOnly = document.getElementById('session-only').checked;

  // Get the base domain for subdomain matching
  const domainParts = currentDomain.split('.');
  const baseDomain = domainParts.length > 2
    ? domainParts.slice(-2).join('.')
    : currentDomain;

  // Fetch cookies
  let cookies = await chrome.cookies.getAll({ domain: currentDomain });

  // Include subdomain cookies if checked
  if (includeSubdomains && baseDomain !== currentDomain) {
    const baseCookies = await chrome.cookies.getAll({ domain: baseDomain });
    const subdomainCookies = await chrome.cookies.getAll({ domain: `.${baseDomain}` });

    // Merge and deduplicate
    const seen = new Set();
    cookies = [...cookies, ...baseCookies, ...subdomainCookies].filter(cookie => {
      const key = `${cookie.name}|${cookie.domain}|${cookie.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Filter session cookies if checked
  if (sessionOnly) {
    cookies = cookies.filter(c => !c.expirationDate);
  }

  allCookies = cookies;
  updateCookieCount(cookies.length);

  // Update preview if visible
  const preview = document.getElementById('preview');
  if (!preview.classList.contains('hidden')) {
    updatePreview();
  }
}

// Update cookie count display
function updateCookieCount(count) {
  const countText = document.getElementById('cookie-count-text');
  countText.textContent = `${count} cookie${count !== 1 ? 's' : ''}`;

  const captureBtn = document.getElementById('capture-btn');
  captureBtn.disabled = count === 0;
}

// Format cookies for AllyLab
function formatCookiesForAllyLab(cookies) {
  return cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path || '/',
    ...(cookie.expirationDate && { expires: Math.floor(cookie.expirationDate) }),
    ...(cookie.httpOnly && { httpOnly: true }),
    ...(cookie.secure && { secure: true }),
    ...(cookie.sameSite && cookie.sameSite !== 'unspecified' && {
      sameSite: cookie.sameSite.charAt(0).toUpperCase() + cookie.sameSite.slice(1)
    }),
  }));
}

// Copy cookies to clipboard
async function captureCookies() {
  if (allCookies.length === 0) {
    showStatus('error', 'No cookies to copy');
    return;
  }

  const formattedCookies = formatCookiesForAllyLab(allCookies);
  const json = JSON.stringify(formattedCookies, null, 2);

  try {
    await navigator.clipboard.writeText(json);
    showStatus('success', `Copied ${allCookies.length} cookie${allCookies.length !== 1 ? 's' : ''} to clipboard!`);
  } catch (error) {
    showStatus('error', 'Failed to copy to clipboard');
  }
}

// Toggle preview visibility
function togglePreview() {
  const preview = document.getElementById('preview');
  const btn = document.getElementById('preview-btn');

  if (preview.classList.contains('hidden')) {
    preview.classList.remove('hidden');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      Hide Preview
    `;
    updatePreview();
  } else {
    preview.classList.add('hidden');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      Preview JSON
    `;
  }
}

// Update preview content
function updatePreview() {
  const formatted = formatCookiesForAllyLab(allCookies);
  const json = JSON.stringify(formatted, null, 2);
  document.getElementById('preview-code').textContent = json;
}

// Show status message
function showStatus(type, message) {
  const status = document.getElementById('status');
  status.className = `status ${type}`;

  const icon = type === 'success'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
    : type === 'error'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  status.innerHTML = `${icon}<span>${message}</span>`;
  status.classList.remove('hidden');

  // Auto-hide after 3 seconds for success
  if (type === 'success') {
    setTimeout(() => {
      status.classList.add('hidden');
    }, 3000);
  }
}
