import { AlertCircle } from 'lucide-react';
import { Button } from '../../ui';
import { METHOD_OPTIONS } from './constants';
import type { AuthProfileFormProps } from './types';

export function AuthProfileForm({ formData, errors, editingId, onFormDataChange, onSave, onClose }: AuthProfileFormProps) {
  const update = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} />
            <strong>Please fix the following errors:</strong>
          </div>
          <ul className="m-0 pl-6">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name & Description */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Profile Name *</label>
        <input
          type="text"
          placeholder="e.g., AmEx Dashboard"
          value={formData.name}
          onChange={e => update('name', e.target.value)}
          className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Description</label>
        <input
          type="text"
          placeholder="Optional description"
          value={formData.description}
          onChange={e => update('description', e.target.value)}
          className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
        />
      </div>

      {/* Domains */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Domains * (comma-separated, supports wildcards)</label>
        <input
          type="text"
          placeholder="e.g., *.americanexpress.com, global.americanexpress.com"
          value={formData.domains}
          onChange={e => update('domains', e.target.value)}
          className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
        />
      </div>

      {/* Method Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Authentication Method *</label>
        <div className="grid grid-cols-3 gap-2">
          {METHOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('method', opt.value)}
              className="flex flex-col items-center gap-1.5 cursor-pointer text-xs font-medium"
              style={{
                padding: '12px 8px',
                borderRadius: 8,
                border: formData.method === opt.value ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                background: formData.method === opt.value ? '#eff6ff' : '#fff',
                color: formData.method === opt.value ? '#1d4ed8' : '#374151',
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
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Cookies (JSON array)</label>
          <textarea
            placeholder='[{"name": "session", "value": "abc123", "domain": ".example.com"}]'
            value={formData.cookiesJson}
            onChange={e => update('cookiesJson', e.target.value)}
            className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-xs font-mono outline-none transition-[border-color] duration-150 min-h-[120px]"
          />
        </div>
      )}

      {formData.method === 'headers' && (
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Headers (JSON object)</label>
          <textarea
            placeholder='{"Authorization": "Bearer your-token-here"}'
            value={formData.headersJson}
            onChange={e => update('headersJson', e.target.value)}
            className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-xs font-mono outline-none transition-[border-color] duration-150 min-h-[120px]"
          />
        </div>
      )}

      {formData.method === 'storage-state' && (
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Storage State (Playwright JSON format)</label>
          <textarea
            placeholder='Paste the contents of your storageState.json file'
            value={formData.storageStateJson}
            onChange={e => update('storageStateJson', e.target.value)}
            className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-xs font-mono outline-none transition-[border-color] duration-150 min-h-[120px]"
          />
        </div>
      )}

      {formData.method === 'login-flow' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Login Page URL *</label>
            <input
              type="url"
              placeholder="https://example.com/login"
              value={formData.loginUrl}
              onChange={e => update('loginUrl', e.target.value)}
              className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Login Steps (JSON array)</label>
            <textarea
              placeholder={`[
  {"action": "fill", "selector": "#username", "value": "user@example.com"},
  {"action": "fill", "selector": "#password", "value": "password123"},
  {"action": "click", "selector": "button[type=submit]"},
  {"action": "waitForNavigation"}
]`}
              value={formData.loginStepsJson}
              onChange={e => update('loginStepsJson', e.target.value)}
              className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-xs font-mono outline-none transition-[border-color] duration-150 min-h-[150px]"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Success Indicator Type</label>
              <select
                value={formData.successIndicatorType}
                onChange={e => update('successIndicatorType', e.target.value as 'url-contains' | 'selector-exists' | 'cookie-exists')}
                className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
              >
                <option value="url-contains">URL contains</option>
                <option value="selector-exists">Selector exists</option>
                <option value="cookie-exists">Cookie exists</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Value *</label>
              <input
                type="text"
                placeholder={formData.successIndicatorType === 'url-contains' ? '/dashboard' : formData.successIndicatorType === 'selector-exists' ? '.user-menu' : 'auth_token'}
                value={formData.successIndicatorValue}
                onChange={e => update('successIndicatorValue', e.target.value)}
                className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
              />
            </div>
          </div>
        </>
      )}

      {formData.method === 'basic-auth' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Username *</label>
            <input
              type="text"
              placeholder="Username"
              value={formData.basicAuthUsername}
              onChange={e => update('basicAuthUsername', e.target.value)}
              className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password *</label>
            <input
              type="password"
              placeholder="Password"
              value={formData.basicAuthPassword}
              onChange={e => update('basicAuthPassword', e.target.value)}
              className="w-full flex-1 py-2.5 px-3.5 rounded-lg border border-slate-200 text-sm outline-none transition-[border-color] duration-150"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          {editingId ? 'Save Changes' : 'Create Profile'}
        </Button>
      </div>
    </div>
  );
}
