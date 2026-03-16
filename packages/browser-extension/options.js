// AllyLab Extension Options
(function() {
  const DEFAULTS = {
    dashboardUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:3001',
    standard: 'wcag21aa',
    autoScan: false,
  };

  // Load saved settings
  function loadSettings() {
    chrome.storage.sync.get(DEFAULTS, (settings) => {
      document.getElementById('dashboardUrl').value = settings.dashboardUrl;
      document.getElementById('apiUrl').value = settings.apiUrl;
      document.getElementById('standard').value = settings.standard;
      document.getElementById('autoScan').checked = settings.autoScan;
    });
  }

  // Save settings
  function saveSettings() {
    const settings = {
      dashboardUrl: document.getElementById('dashboardUrl').value || DEFAULTS.dashboardUrl,
      apiUrl: document.getElementById('apiUrl').value || DEFAULTS.apiUrl,
      standard: document.getElementById('standard').value,
      autoScan: document.getElementById('autoScan').checked,
    };

    chrome.storage.sync.set(settings, () => {
      const status = document.getElementById('status');
      status.classList.add('visible');
      setTimeout(() => status.classList.remove('visible'), 2000);
    });
  }

  document.getElementById('save').addEventListener('click', saveSettings);
  document.addEventListener('DOMContentLoaded', loadSettings);
})();
