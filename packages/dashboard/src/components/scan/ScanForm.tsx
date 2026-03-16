import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { Button, Input, Select } from '../ui';
import { CustomRulesIndicator } from './CustomRulesIndicator';
import { CanScan } from '../guards/RoleGuard';
import { Monitor, Tablet, Smartphone, Tv, Search, Loader2, Lock } from 'lucide-react';
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
  { value: 'tv-hd', label: 'TV HD', icon: <Tv size={16} /> },
  { value: 'tv-4k', label: 'TV 4K', icon: <Tv size={16} /> },
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

  const resolutionLabel = {
    desktop: '1280×720',
    tablet: '768×1024',
    mobile: '375×667',
    'tv-hd': '1920×1080',
    'tv-4k': '3840×2160',
  }[viewport];

  return (
    <div className="bg-slate-800 rounded-xl p-5 flex flex-col gap-3">
      {/* Row 1: URL + Scan button */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Enter URL to scan (e.g., https://example.com)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={isScanning}
          className="flex-1 min-w-0 bg-slate-900 text-white border border-slate-700"
        />
        <CanScan fallback={<span className="text-sm text-slate-400">No scan permission</span>}>
          <Button onClick={handleSubmit} disabled={isScanning || !url.trim()}>
            {isScanning ? (
              <><Loader2 size={14} className="mr-1.5 animate-spin" />Scanning...</>
            ) : (
              <><Search size={14} className="mr-1.5" />Scan</>
            )}
          </Button>
        </CanScan>
      </div>

      {/* Row 2: Options bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Viewport Selector */}
        <div className="flex gap-1 bg-slate-900 rounded-lg p-1 items-center">
          {VIEWPORTS.map(v => (
            <button
              key={v.value}
              onClick={() => setViewport(v.value)}
              disabled={isScanning}
              title={`${v.label} (${resolutionLabel})`}
              className={`py-1.5 px-2 rounded-md border-none text-base transition-all duration-200 flex items-center gap-1.5 ${
                viewport === v.value ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-400 hover:text-slate-200'
              } ${isScanning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{v.icon}</span>
              {viewport === v.value && (
                <span className="text-xs font-medium">{v.label}</span>
              )}
            </button>
          ))}
          <span className="text-xs text-slate-500 pl-2 pr-1">{resolutionLabel}</span>
        </div>

        {/* Standard Selector */}
        <Select
          options={STANDARDS}
          value={standard}
          onChange={e => setStandard(e.target.value as WCAGStandard)}
          aria-label="WCAG Standard"
          className="bg-slate-900 text-white border border-slate-700"
        />

        {/* Auth Profile Selector (only show if profiles exist) */}
        {authProfiles.length > 0 && (
          <div className="flex gap-2 items-center">
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
              className="bg-slate-900 text-white border border-slate-700"
              style={{
                borderColor: selectedAuthId ? '#22c55e' : undefined,
              }}
            />
          </div>
        )}

        {selectedAuthId && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Lock size={12} />
            Authenticated
          </span>
        )}

        <div className="ml-auto">
          <CustomRulesIndicator />
        </div>
      </div>
    </div>
  );
}