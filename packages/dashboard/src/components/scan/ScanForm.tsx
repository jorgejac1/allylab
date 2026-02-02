import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { Button, Input, Select } from '../ui';
import { CustomRulesIndicator } from './CustomRulesIndicator';
import { Monitor, Tablet, Smartphone, Search, Loader2, Lock } from 'lucide-react';
import type { WCAGStandard, Viewport } from '../../types';
import type { ScanAuthOptions } from '../../types/auth';
import { getAuthProfiles, profileToAuthOptions, findProfileForDomain } from '../../utils/authProfiles';

interface ScanOptions {
  standard: WCAGStandard;
  viewport: Viewport;
  auth?: ScanAuthOptions;
}

interface ScanFormProps {
  onScan: (url: string, options: ScanOptions) => void;
  isScanning: boolean;
  initialUrl?: string;
}

const STANDARDS: { value: WCAGStandard; label: string }[] = [
  { value: 'wcag21aa', label: 'WCAG 2.1 AA' },
  { value: 'wcag22aa', label: 'WCAG 2.2 AA' },
  { value: 'wcag21a', label: 'WCAG 2.1 A' },
  { value: 'wcag2aa', label: 'WCAG 2.0 AA' },
  { value: 'wcag2a', label: 'WCAG 2.0 A' },
];

const VIEWPORTS: { value: Viewport; label: string; icon: ReactNode }[] = [
  { value: 'desktop', label: 'Desktop', icon: <Monitor size={16} /> },
  { value: 'tablet', label: 'Tablet', icon: <Tablet size={16} /> },
  { value: 'mobile', label: 'Mobile', icon: <Smartphone size={16} /> },
];

export function ScanForm({ onScan, isScanning, initialUrl = '' }: ScanFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [standard, setStandard] = useState<WCAGStandard>('wcag21aa');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [selectedAuthId, setSelectedAuthId] = useState<string>('');

  // Load auth profiles (lazy initialization)
  const authProfiles = useMemo(() => getAuthProfiles().filter(p => p.enabled), []);

  // Auto-detect matching profile when URL changes
  const autoDetectedProfile = useMemo(() => {
    if (!url.trim()) {
      return null;
    }

    try {
      let testUrl = url.trim();
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = `https://${testUrl}`;
      }
      const domain = new URL(testUrl).hostname;
      return findProfileForDomain(domain) || null;
    } catch {
      return null;
    }
  }, [url]);

  // Auto-select profile when auto-detected and no manual selection
  useEffect(() => {
    if (autoDetectedProfile && !selectedAuthId) {
      setSelectedAuthId(autoDetectedProfile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetectedProfile]);

  const handleSubmit = () => {
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    // Get auth options from selected profile
    let auth: ScanAuthOptions | undefined;
    if (selectedAuthId) {
      const profile = authProfiles.find(p => p.id === selectedAuthId);
      if (profile) {
        auth = profileToAuthOptions(profile);
      }
    }

    onScan(finalUrl, { standard, viewport, auth });
  };

  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="Enter URL to scan (e.g., https://example.com)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={isScanning}
          style={{
            flex: 1,
            minWidth: 300,
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#fff',
          }}
        />
        
        {/* Viewport Selector */}
        <div style={{ display: 'flex', gap: 4, background: '#0f172a', borderRadius: 8, padding: 4 }}>
          {VIEWPORTS.map(v => (
            <button
              key={v.value}
              onClick={() => setViewport(v.value)}
              disabled={isScanning}
              title={v.label}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewport === v.value ? '#2563eb' : 'transparent',
                color: viewport === v.value ? '#fff' : '#94a3b8',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                fontSize: 16,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{v.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{v.label}</span>
            </button>
          ))}
        </div>

        {/* Standard Selector */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span id="wcag-standard-label" style={{ color: '#94a3b8', fontSize: 14 }}>Standard:</span>
          <Select
            options={STANDARDS}
            value={standard}
            onChange={e => setStandard(e.target.value as WCAGStandard)}
            aria-labelledby="wcag-standard-label"
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              minWidth: 140,
            }}
          />
        </div>

        {/* Auth Profile Selector (only show if profiles exist) */}
        {authProfiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Lock size={14} style={{ color: selectedAuthId ? '#22c55e' : '#94a3b8' }} />
            <Select
              options={[
                { value: '', label: 'No Auth' },
                ...authProfiles.map(p => ({
                  value: p.id,
                  label: `${p.name}${autoDetectedProfile?.id === p.id ? ' (auto)' : ''}`,
                })),
              ]}
              value={selectedAuthId}
              onChange={e => setSelectedAuthId(e.target.value)}
              aria-label="Authentication profile"
              style={{
                background: '#0f172a',
                border: `1px solid ${selectedAuthId ? '#22c55e' : '#334155'}`,
                color: '#fff',
                minWidth: 130,
              }}
            />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={isScanning || !url.trim()}>
          {isScanning ? (
            <><Loader2 size={14} style={{ marginRight: 6, animation: 'spin 1s linear infinite' }} />Scanning...</>
          ) : (
            <><Search size={14} style={{ marginRight: 6 }} />Scan Page</>
          )}
        </Button>
      </div>
      
      {/* Bottom Info Row */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Viewport Info */}
        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>
            Testing as: {VIEWPORTS.find(v => v.value === viewport)?.icon}{' '}
            {viewport === 'desktop' && '1280×720'}
            {viewport === 'tablet' && '768×1024'}
            {viewport === 'mobile' && '375×667 (2x scale)'}
          </span>
          {selectedAuthId && (
            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} />
              Authenticated scan
            </span>
          )}
        </div>

        {/* Custom Rules Indicator */}
        <CustomRulesIndicator />
      </div>
    </div>
  );
}