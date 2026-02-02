import { useState } from 'react';
import { Button, Card, Modal } from '../ui';
import type { AuthProfile, AuthMethod } from '../../types/auth';
import {
  getAuthProfiles,
  saveAuthProfile,
  deleteAuthProfile,
  toggleProfileEnabled,
  getAuthMethodLabel,
  validateAuthProfile,
  exportProfiles,
  importProfiles,
  profileToAuthOptions,
  checkProfileHealth,
  updateProfileTestResult,
} from '../../utils/authProfiles';
import { getApiBase } from '../../utils/api';
import {
  Key,
  Cookie,
  FileJson,
  LogIn,
  Lock,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Globe,
  AlertCircle,
  AlertTriangle,
  PlayCircle,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#475569',
  marginBottom: 6,
  display: 'block',
};

const METHOD_OPTIONS: { value: AuthMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'cookies', label: 'Cookies', icon: <Cookie size={20} />, description: 'Inject session cookies' },
  { value: 'headers', label: 'Headers', icon: <Key size={20} />, description: 'Add Authorization headers' },
  { value: 'storage-state', label: 'Storage State', icon: <FileJson size={20} />, description: 'Playwright state file' },
  { value: 'login-flow', label: 'Login Flow', icon: <LogIn size={20} />, description: 'Automated login steps' },
  { value: 'basic-auth', label: 'Basic Auth', icon: <Lock size={20} />, description: 'HTTP Basic Auth' },
];

interface ProfileFormData {
  name: string;
  description: string;
  domains: string;
  method: AuthMethod;
  // Cookies
  cookiesJson: string;
  // Headers
  headersJson: string;
  // Storage state
  storageStateJson: string;
  // Login flow
  loginUrl: string;
  loginStepsJson: string;
  successIndicatorType: 'url-contains' | 'selector-exists' | 'cookie-exists';
  successIndicatorValue: string;
  // Basic auth
  basicAuthUsername: string;
  basicAuthPassword: string;
}

const defaultFormData: ProfileFormData = {
  name: '',
  description: '',
  domains: '',
  method: 'cookies',
  cookiesJson: '[]',
  headersJson: '{}',
  storageStateJson: '',
  loginUrl: '',
  loginStepsJson: '[]',
  successIndicatorType: 'url-contains',
  successIndicatorValue: '',
  basicAuthUsername: '',
  basicAuthPassword: '',
};

export function AuthProfilesManager() {
  // Use lazy initialization to avoid setState in useEffect
  const [profiles, setProfiles] = useState<AuthProfile[]>(() => getAuthProfiles());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [errors, setErrors] = useState<string[]>([]);

  // Test modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testingProfile, setTestingProfile] = useState<AuthProfile | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setErrors([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: AuthProfile) => {
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      domains: profile.domains.join(', '),
      method: profile.method,
      cookiesJson: JSON.stringify(profile.cookies || [], null, 2),
      headersJson: JSON.stringify(profile.headers || {}, null, 2),
      storageStateJson: profile.storageState ? JSON.stringify(profile.storageState, null, 2) : '',
      loginUrl: profile.loginFlow?.loginUrl || '',
      loginStepsJson: JSON.stringify(profile.loginFlow?.steps || [], null, 2),
      successIndicatorType: profile.loginFlow?.successIndicator?.type || 'url-contains',
      successIndicatorValue: profile.loginFlow?.successIndicator?.value || '',
      basicAuthUsername: profile.basicAuth?.username || '',
      basicAuthPassword: profile.basicAuth?.password || '',
    });
    setErrors([]);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Parse form data into profile
    const domains = formData.domains.split(',').map(d => d.trim()).filter(Boolean);

    const profile: Partial<AuthProfile> = {
      id: editingId || undefined,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      domains,
      method: formData.method,
      enabled: true,
    };

    // Set method-specific data
    try {
      switch (formData.method) {
        case 'cookies':
          profile.cookies = JSON.parse(formData.cookiesJson);
          break;
        case 'headers':
          profile.headers = JSON.parse(formData.headersJson);
          break;
        case 'storage-state':
          profile.storageState = JSON.parse(formData.storageStateJson);
          break;
        case 'login-flow':
          profile.loginFlow = {
            loginUrl: formData.loginUrl,
            steps: JSON.parse(formData.loginStepsJson),
            successIndicator: {
              type: formData.successIndicatorType,
              value: formData.successIndicatorValue,
            },
          };
          break;
        case 'basic-auth':
          profile.basicAuth = {
            username: formData.basicAuthUsername,
            password: formData.basicAuthPassword,
          };
          break;
      }
    } catch {
      setErrors(['Invalid JSON format in configuration']);
      return;
    }

    // Validate
    const validationErrors = validateAuthProfile(profile);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Save
    saveAuthProfile(profile as Omit<AuthProfile, 'id' | 'createdAt'>);
    setProfiles(getAuthProfiles());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this authentication profile?')) {
      deleteAuthProfile(id);
      setProfiles(getAuthProfiles());
    }
  };

  const handleToggle = (id: string) => {
    toggleProfileEnabled(id);
    setProfiles(getAuthProfiles());
  };

  // Test profile
  const handleOpenTest = (profile: AuthProfile) => {
    setTestingProfile(profile);
    // Pre-fill with first domain if available
    if (profile.domains.length > 0) {
      const domain = profile.domains[0].replace('*.', '');
      setTestUrl(`https://${domain}`);
    } else {
      setTestUrl('');
    }
    setTestStatus('idle');
    setTestMessage('');
    setTestModalOpen(true);
  };

  const handleRunTest = async () => {
    if (!testingProfile || !testUrl) return;

    setTestStatus('testing');
    setTestMessage('Testing authentication...');

    try {
      const authOptions = profileToAuthOptions(testingProfile);
      const response = await fetch(`${getApiBase()}/scan/test-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          auth: authOptions,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTestStatus('success');
        setTestMessage(result.message || 'Authentication successful! The page was accessed with your credentials.');
        // Save successful test result
        updateProfileTestResult(testingProfile.id, true, 'Test passed', result.statusCode);
        setProfiles(getAuthProfiles());
      } else {
        setTestStatus('error');
        const errorMsg = result.error || result.message || 'Authentication test failed';
        setTestMessage(errorMsg);
        // Save failed test result
        updateProfileTestResult(testingProfile.id, false, errorMsg, result.statusCode);
        setProfiles(getAuthProfiles());
      }
    } catch (err) {
      setTestStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to API';
      setTestMessage(errorMsg);
      // Save failed test result
      updateProfileTestResult(testingProfile.id, false, errorMsg);
      setProfiles(getAuthProfiles());
    }
  };

  // Export profiles
  const handleExport = () => {
    const json = exportProfiles();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allylab-auth-profiles-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import profiles
  const handleOpenImport = () => {
    setImportJson('');
    setImportOverwrite(false);
    setImportResult(null);
    setImportModalOpen(true);
  };

  const handleImport = () => {
    const result = importProfiles(importJson, importOverwrite);
    setImportResult(result);
    if (result.imported > 0) {
      setProfiles(getAuthProfiles());
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const getMethodIcon = (method: AuthMethod) => {
    return METHOD_OPTIONS.find(m => m.value === method)?.icon || <Key size={20} />;
  };

  const getHealthBadge = (profile: AuthProfile) => {
    const health = checkProfileHealth(profile);

    if (health.status === 'healthy') {
      return (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: '#dcfce7',
            color: '#166534',
            fontSize: 10,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={health.message}
        >
          <CheckCircle size={10} />
          Verified
        </span>
      );
    }

    if (health.status === 'warning') {
      return (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: '#fef3c7',
            color: '#92400e',
            fontSize: 10,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={health.message}
        >
          <AlertTriangle size={10} />
          {health.daysSinceTest}d ago
        </span>
      );
    }

    if (health.status === 'expired') {
      return (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: '#fee2e2',
            color: '#dc2626',
            fontSize: 10,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={health.message}
        >
          <XCircle size={10} />
          Needs Test
        </span>
      );
    }

    // untested
    return (
      <span
        style={{
          padding: '2px 6px',
          borderRadius: 4,
          background: '#f1f5f9',
          color: '#64748b',
          fontSize: 10,
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
        title={health.message}
      >
        <Clock size={10} />
        Untested
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Authentication Profiles</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Configure authentication for scanning protected pages (dashboards, admin panels)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {profiles.length > 0 && (
            <Button variant="secondary" onClick={handleExport}>
              <Download size={16} style={{ marginRight: 6 }} />
              Export
            </Button>
          )}
          <Button variant="secondary" onClick={handleOpenImport}>
            <Upload size={16} style={{ marginRight: 6 }} />
            Import
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Add Profile
          </Button>
        </div>
      </div>

      {/* Profiles List */}
      {profiles.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
            <Lock size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: 14 }}>
              No authentication profiles yet. Add one to scan protected pages.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profiles.map(profile => (
            <Card key={profile.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Icon */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: profile.enabled ? '#eff6ff' : '#f1f5f9',
                  color: profile.enabled ? '#3b82f6' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {getMethodIcon(profile.method)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{profile.name}</h4>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: profile.enabled ? '#dcfce7' : '#f1f5f9',
                      color: profile.enabled ? '#166534' : '#64748b',
                      fontSize: 11,
                      fontWeight: 500,
                    }}>
                      {getAuthMethodLabel(profile.method)}
                    </span>
                    {profile.enabled && getHealthBadge(profile)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Globe size={12} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {profile.domains.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleOpenTest(profile)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#3b82f6',
                    }}
                    title="Test Profile"
                  >
                    <PlayCircle size={18} />
                  </button>
                  <button
                    onClick={() => handleToggle(profile.id)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: profile.enabled ? '#22c55e' : '#94a3b8',
                    }}
                    title={profile.enabled ? 'Disable' : 'Enable'}
                  >
                    {profile.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(profile)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    style={{
                      padding: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Authentication Profile' : 'New Authentication Profile'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Errors */}
          {errors.length > 0 && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertCircle size={16} />
                <strong>Please fix the following errors:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: 24 }}>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Name & Description */}
          <div>
            <label style={labelStyle}>Profile Name *</label>
            <input
              type="text"
              placeholder="e.g., AmEx Dashboard"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              placeholder="Optional description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* Domains */}
          <div>
            <label style={labelStyle}>Domains * (comma-separated, supports wildcards)</label>
            <input
              type="text"
              placeholder="e.g., *.americanexpress.com, global.americanexpress.com"
              value={formData.domains}
              onChange={e => setFormData({ ...formData, domains: e.target.value })}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          {/* Method Selection */}
          <div>
            <label style={labelStyle}>Authentication Method *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {METHOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, method: opt.value })}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 8,
                    border: formData.method === opt.value ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: formData.method === opt.value ? '#eff6ff' : '#fff',
                    color: formData.method === opt.value ? '#1d4ed8' : '#374151',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method-specific fields */}
          {formData.method === 'cookies' && (
            <div>
              <label style={labelStyle}>Cookies (JSON array)</label>
              <textarea
                placeholder='[{"name": "session", "value": "abc123", "domain": ".example.com"}]'
                value={formData.cookiesJson}
                onChange={e => setFormData({ ...formData, cookiesJson: e.target.value })}
                style={{ ...inputStyle, width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          )}

          {formData.method === 'headers' && (
            <div>
              <label style={labelStyle}>Headers (JSON object)</label>
              <textarea
                placeholder='{"Authorization": "Bearer your-token-here"}'
                value={formData.headersJson}
                onChange={e => setFormData({ ...formData, headersJson: e.target.value })}
                style={{ ...inputStyle, width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          )}

          {formData.method === 'storage-state' && (
            <div>
              <label style={labelStyle}>Storage State (Playwright JSON format)</label>
              <textarea
                placeholder='Paste the contents of your storageState.json file'
                value={formData.storageStateJson}
                onChange={e => setFormData({ ...formData, storageStateJson: e.target.value })}
                style={{ ...inputStyle, width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          )}

          {formData.method === 'login-flow' && (
            <>
              <div>
                <label style={labelStyle}>Login Page URL *</label>
                <input
                  type="url"
                  placeholder="https://example.com/login"
                  value={formData.loginUrl}
                  onChange={e => setFormData({ ...formData, loginUrl: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Login Steps (JSON array)</label>
                <textarea
                  placeholder={`[
  {"action": "fill", "selector": "#username", "value": "user@example.com"},
  {"action": "fill", "selector": "#password", "value": "password123"},
  {"action": "click", "selector": "button[type=submit]"},
  {"action": "waitForNavigation"}
]`}
                  value={formData.loginStepsJson}
                  onChange={e => setFormData({ ...formData, loginStepsJson: e.target.value })}
                  style={{ ...inputStyle, width: '100%', minHeight: 150, fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Success Indicator Type</label>
                  <select
                    value={formData.successIndicatorType}
                    onChange={e => setFormData({ ...formData, successIndicatorType: e.target.value as 'url-contains' | 'selector-exists' | 'cookie-exists' })}
                    style={{ ...inputStyle, width: '100%' }}
                  >
                    <option value="url-contains">URL contains</option>
                    <option value="selector-exists">Selector exists</option>
                    <option value="cookie-exists">Cookie exists</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Value *</label>
                  <input
                    type="text"
                    placeholder={formData.successIndicatorType === 'url-contains' ? '/dashboard' : formData.successIndicatorType === 'selector-exists' ? '.user-menu' : 'auth_token'}
                    value={formData.successIndicatorValue}
                    onChange={e => setFormData({ ...formData, successIndicatorValue: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              </div>
            </>
          )}

          {formData.method === 'basic-auth' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Username *</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.basicAuthUsername}
                  onChange={e => setFormData({ ...formData, basicAuthUsername: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Password *</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.basicAuthPassword}
                  onChange={e => setFormData({ ...formData, basicAuthPassword: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Create Profile'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Test Authentication Profile"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Testing profile:</div>
            <div style={{ fontWeight: 600 }}>{testingProfile?.name}</div>
          </div>

          <div>
            <label style={labelStyle}>Test URL</label>
            <input
              type="url"
              placeholder="https://example.com/protected-page"
              value={testUrl}
              onChange={e => setTestUrl(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
              disabled={testStatus === 'testing'}
            />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
              Enter a URL that requires authentication to access
            </p>
          </div>

          {/* Test Result */}
          {testStatus !== 'idle' && (
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: testStatus === 'success' ? '#f0fdf4' : testStatus === 'error' ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${testStatus === 'success' ? '#86efac' : testStatus === 'error' ? '#fecaca' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              {testStatus === 'testing' && (
                <Loader2 size={20} style={{ color: '#64748b', animation: 'spin 1s linear infinite' }} />
              )}
              {testStatus === 'success' && (
                <CheckCircle size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
              )}
              {testStatus === 'error' && (
                <XCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: testStatus === 'success' ? '#166534' : testStatus === 'error' ? '#dc2626' : '#374151',
                }}>
                  {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Success' : 'Failed'}
                </div>
                <div style={{
                  fontSize: 13,
                  color: testStatus === 'success' ? '#166534' : testStatus === 'error' ? '#dc2626' : '#64748b',
                  marginTop: 4,
                }}>
                  {testMessage}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary" onClick={() => setTestModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleRunTest} disabled={!testUrl || testStatus === 'testing'}>
              {testStatus === 'testing' ? (
                <><Loader2 size={16} style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} /> Testing...</>
              ) : (
                <><PlayCircle size={16} style={{ marginRight: 6 }} /> Run Test</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Authentication Profiles"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* File Upload */}
          <div>
            <label style={labelStyle}>Upload JSON file</label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px dashed #e2e8f0',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>or</div>

          {/* JSON Textarea */}
          <div>
            <label style={labelStyle}>Paste JSON</label>
            <textarea
              placeholder="Paste exported profiles JSON here..."
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%',
                minHeight: 150,
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            />
          </div>

          {/* Overwrite option */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={importOverwrite}
              onChange={e => setImportOverwrite(e.target.checked)}
            />
            <span style={{ fontSize: 13, color: '#475569' }}>
              Overwrite existing profiles with same name
            </span>
          </label>

          {/* Import Result */}
          {importResult && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: importResult.imported > 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${importResult.imported > 0 ? '#86efac' : '#fecaca'}`,
            }}>
              {importResult.imported > 0 && (
                <div style={{ color: '#166534', fontSize: 14, fontWeight: 500 }}>
                  ✓ Successfully imported {importResult.imported} profile{importResult.imported > 1 ? 's' : ''}
                </div>
              )}
              {importResult.errors.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: '#dc2626', fontSize: 13 }}>
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              {importResult?.imported ? 'Done' : 'Cancel'}
            </Button>
            {!importResult?.imported && (
              <Button onClick={handleImport} disabled={!importJson.trim()}>
                <Upload size={16} style={{ marginRight: 6 }} />
                Import
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
