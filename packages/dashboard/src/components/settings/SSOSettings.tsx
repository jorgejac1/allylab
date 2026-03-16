import { useState } from 'react';
import { Card, Button, Input, Select, Textarea } from '../ui';
import { useLocalStorage } from '../../hooks';
import { PlanGate } from '../guards/PlanGate';
import { Shield, Loader2, Plug, Check, KeyRound } from 'lucide-react';

interface SSOConfig {
  enabled: boolean;
  provider: 'saml' | 'oidc';
  entityId: string;
  ssoUrl: string;
  certificate: string;
  signatureAlgorithm: 'sha256' | 'sha512';
  nameIdFormat: string;
  attributeMapping: { email: string; firstName: string; lastName: string; role?: string };
}

const DEFAULT_SSO_CONFIG: SSOConfig = {
  enabled: false,
  provider: 'saml',
  entityId: '',
  ssoUrl: '',
  certificate: '',
  signatureAlgorithm: 'sha256',
  nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  attributeMapping: {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    role: 'role',
  },
};

export function SSOSettings() {
  const [config, setConfig] = useLocalStorage<SSOConfig>('allylab_sso_config', DEFAULT_SSO_CONFIG);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('inactive');

  const handleConfigChange = <K extends keyof SSOConfig>(key: K, value: SSOConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleMappingChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      attributeMapping: { ...prev.attributeMapping, [field]: value },
    }));
    setSaved(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Validate locally first
      const errors: string[] = [];
      if (!config.entityId) errors.push('Entity ID is required');
      if (!config.ssoUrl) errors.push('SSO URL is required');
      if (!config.certificate) errors.push('Certificate is required');

      if (errors.length > 0) {
        setTestResult({ success: false, message: errors.join(', ') });
        setStatus('inactive');
      } else {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTestResult({ success: true, message: 'SSO configuration validated successfully' });
        setStatus('active');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setStatus('inactive');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
  };

  const handleSaveAnimationEnd = () => {
    setSaved(false);
  };

  const handleReset = () => {
    setConfig(DEFAULT_SSO_CONFIG);
    setTestResult(null);
    setStatus('inactive');
    setSaved(false);
  };

  const statusColors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    inactive: 'text-slate-500 bg-slate-50 border-slate-200',
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
  };

  return (
    <PlanGate feature="sso">
      <div className="flex flex-col gap-6">
        <style>{`
          @keyframes savedSuccess {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}</style>

        {/* Enable/Disable + Status */}
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold m-0 inline-flex items-center gap-2">
                <Shield size={18} /> SSO / SAML Authentication
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-0">
                Configure Single Sign-On for your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={e => handleConfigChange('enabled', e.target.checked)}
                  className="w-[18px] h-[18px]"
                />
                <span className="text-sm font-medium">
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </Card>

        {config.enabled && (
          <>
            {/* Provider Configuration */}
            <Card>
              <h3 className="text-base font-semibold mt-0 mb-4 inline-flex items-center gap-2">
                <KeyRound size={18} /> Provider Configuration
              </h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Identity Provider
                  </label>
                  <Select
                    value={config.provider}
                    onChange={e => handleConfigChange('provider', e.target.value as 'saml' | 'oidc')}
                    options={[
                      { value: 'saml', label: 'SAML 2.0' },
                      { value: 'oidc', label: 'OpenID Connect (OIDC)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Entity ID / Issuer
                  </label>
                  <Input
                    value={config.entityId}
                    onChange={e => handleConfigChange('entityId', e.target.value)}
                    placeholder="https://idp.example.com/metadata"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    The unique identifier for your identity provider
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    SSO Login URL
                  </label>
                  <Input
                    value={config.ssoUrl}
                    onChange={e => handleConfigChange('ssoUrl', e.target.value)}
                    placeholder="https://idp.example.com/sso/saml"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    The URL where users are redirected to authenticate
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    X.509 Certificate
                  </label>
                  <Textarea
                    value={config.certificate}
                    onChange={e => handleConfigChange('certificate', e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIICpDCCAYwCCQD...&#10;-----END CERTIFICATE-----"
                    rows={5}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Paste the public certificate from your identity provider
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Signature Algorithm
                    </label>
                    <Select
                      value={config.signatureAlgorithm}
                      onChange={e => handleConfigChange('signatureAlgorithm', e.target.value as 'sha256' | 'sha512')}
                      options={[
                        { value: 'sha256', label: 'SHA-256' },
                        { value: 'sha512', label: 'SHA-512' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Name ID Format
                    </label>
                    <Select
                      value={config.nameIdFormat}
                      onChange={e => handleConfigChange('nameIdFormat', e.target.value)}
                      options={[
                        { value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress', label: 'Email Address' },
                        { value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified', label: 'Unspecified' },
                        { value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent', label: 'Persistent' },
                        { value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient', label: 'Transient' },
                      ]}
                    />
                  </div>
                </div>

                {/* Test Connection */}
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="secondary"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5"
                  >
                    {testing ? <><Loader2 size={14} className="animate-spin" /> Testing...</> : <><Plug size={14} /> Test Connection</>}
                  </Button>
                  {testResult && (
                    <span
                      className={`text-sm ${testResult.success ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {testResult.message}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Attribute Mapping */}
            <Card>
              <h3 className="text-base font-semibold mt-0 mb-4">
                Attribute Mapping
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Map SAML attributes to AllyLab user fields
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Email Attribute
                  </label>
                  <Input
                    value={config.attributeMapping.email}
                    onChange={e => handleMappingChange('email', e.target.value)}
                    placeholder="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    First Name Attribute
                  </label>
                  <Input
                    value={config.attributeMapping.firstName}
                    onChange={e => handleMappingChange('firstName', e.target.value)}
                    placeholder="firstName"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Last Name Attribute
                  </label>
                  <Input
                    value={config.attributeMapping.lastName}
                    onChange={e => handleMappingChange('lastName', e.target.value)}
                    placeholder="lastName"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Role Attribute (Optional)
                  </label>
                  <Input
                    value={config.attributeMapping.role || ''}
                    onChange={e => handleMappingChange('role', e.target.value)}
                    placeholder="role"
                  />
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5"
                style={saved ? { animation: 'savedSuccess 2s ease-out' } : undefined}
                onAnimationEnd={handleSaveAnimationEnd}
              >
                {saved ? <><Check size={14} /> Saved!</> : 'Save Settings'}
              </Button>
            </div>
          </>
        )}
      </div>
    </PlanGate>
  );
}
