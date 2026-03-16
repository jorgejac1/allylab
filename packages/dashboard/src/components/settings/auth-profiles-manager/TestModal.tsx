import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, PlayCircle } from 'lucide-react';
import { Button, Modal } from '../../ui';
import { profileToAuthOptions, updateProfileTestResult } from '../../../utils/authProfiles';
import { getApiBase } from '../../../utils/api';
import type { TestModalProps } from './types';

export function TestModal({ isOpen, onClose, profile }: TestModalProps) {
  const defaultUrl = profile?.domains.length
    ? `https://${profile.domains[0].replace('*.', '')}`
    : '';

  const [testUrl, setTestUrl] = useState(defaultUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Reset state when profile changes
  const [lastProfileId, setLastProfileId] = useState<string | null>(null);
  if (profile && profile.id !== lastProfileId) {
    setLastProfileId(profile.id);
    const url = profile.domains.length
      ? `https://${profile.domains[0].replace('*.', '')}`
      : '';
    setTestUrl(url);
    setTestStatus('idle');
    setTestMessage('');
  }

  const handleRunTest = async () => {
    if (!profile || !testUrl) return;

    setTestStatus('testing');
    setTestMessage('Testing authentication...');

    try {
      const authOptions = profileToAuthOptions(profile);
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
        updateProfileTestResult(profile.id, true, 'Test passed', result.statusCode);
      } else {
        setTestStatus('error');
        const errorMsg = result.error || result.message || 'Authentication test failed';
        setTestMessage(errorMsg);
        updateProfileTestResult(profile.id, false, errorMsg, result.statusCode);
      }
    } catch (err) {
      setTestStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to API';
      setTestMessage(errorMsg);
      updateProfileTestResult(profile.id, false, errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Authentication Profile"
    >
      <div className="flex flex-col gap-5">
        <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">Testing profile:</div>
          <div className="font-semibold">{profile?.name}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Test URL</label>
          <input
            type="url"
            placeholder="https://example.com/protected-page"
            value={testUrl}
            onChange={e => setTestUrl(e.target.value)}
            className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
            disabled={testStatus === 'testing'}
          />
          <p className="mt-1.5 mb-0 text-xs text-slate-500">
            Enter a URL that requires authentication to access
          </p>
        </div>

        {/* Test Result */}
        {testStatus !== 'idle' && (
          <div
            className="p-4 rounded-lg flex items-start gap-3"
            style={{
              background: testStatus === 'success' ? '#f0fdf4' : testStatus === 'error' ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${testStatus === 'success' ? '#86efac' : testStatus === 'error' ? '#fecaca' : '#e2e8f0'}`,
            }}
          >
            {testStatus === 'testing' && (
              <Loader2 size={20} className="text-slate-500 animate-spin" />
            )}
            {testStatus === 'success' && (
              <CheckCircle size={20} className="text-green-500 shrink-0" />
            )}
            {testStatus === 'error' && (
              <XCircle size={20} className="text-red-500 shrink-0" />
            )}
            <div className="flex-1">
              <div
                className="font-semibold text-sm"
                style={{
                  color: testStatus === 'success' ? '#166534' : testStatus === 'error' ? '#dc2626' : '#374151',
                }}
              >
                {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Success' : 'Failed'}
              </div>
              <div
                className="text-sm mt-1"
                style={{
                  color: testStatus === 'success' ? '#166534' : testStatus === 'error' ? '#dc2626' : '#64748b',
                }}
              >
                {testMessage}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleRunTest} disabled={!testUrl || testStatus === 'testing'}>
            {testStatus === 'testing' ? (
              <><Loader2 size={16} className="mr-1.5 animate-spin" /> Testing...</>
            ) : (
              <><PlayCircle size={16} className="mr-1.5" /> Run Test</>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
