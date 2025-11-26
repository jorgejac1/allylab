import { useState, useEffect } from 'react';
import { Button, Input, Select } from '../ui';
import type { WCAGStandard, Viewport } from '../../types';

interface ScanFormProps {
  onScan: (url: string, options: { standard: WCAGStandard; viewport: Viewport }) => void;
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

const VIEWPORTS: { value: Viewport; label: string; icon: string }[] = [
  { value: 'desktop', label: 'Desktop', icon: '🖥️' },
  { value: 'tablet', label: 'Tablet', icon: '📱' },
  { value: 'mobile', label: 'Mobile', icon: '📲' },
];

export function ScanForm({ onScan, isScanning, initialUrl }: ScanFormProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [standard, setStandard] = useState<WCAGStandard>('wcag21aa');
  const [viewport, setViewport] = useState<Viewport>('desktop');

  // Update URL when initialUrl changes (from drill-down navigation)
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleSubmit = () => {
    if (!url.trim()) return;
    
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    
    onScan(finalUrl, { standard, viewport });
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
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Standard:</span>
          <Select
            options={STANDARDS}
            value={standard}
            onChange={e => setStandard(e.target.value as WCAGStandard)}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              minWidth: 140,
            }}
          />
        </div>
        
        <Button onClick={handleSubmit} disabled={isScanning || !url.trim()}>
          {isScanning ? '⏳ Scanning...' : '🔍 Scan Page'}
        </Button>
      </div>
      
      {/* Viewport Info */}
      <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
        Testing as: {VIEWPORTS.find(v => v.value === viewport)?.icon}{' '}
        {viewport === 'desktop' && '1280×720'}
        {viewport === 'tablet' && '768×1024'}
        {viewport === 'mobile' && '375×667 (2x scale)'}
      </div>
    </div>
  );
}