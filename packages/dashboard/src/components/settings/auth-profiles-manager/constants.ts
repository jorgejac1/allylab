import React from 'react';
import { Cookie, Key, FileJson, LogIn, Lock } from 'lucide-react';
import type { AuthMethod, ProfileFormData } from './types';

export const METHOD_OPTIONS: { value: AuthMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'cookies', label: 'Cookies', icon: React.createElement(Cookie, { size: 20 }), description: 'Inject session cookies' },
  { value: 'headers', label: 'Headers', icon: React.createElement(Key, { size: 20 }), description: 'Add Authorization headers' },
  { value: 'storage-state', label: 'Storage State', icon: React.createElement(FileJson, { size: 20 }), description: 'Playwright state file' },
  { value: 'login-flow', label: 'Login Flow', icon: React.createElement(LogIn, { size: 20 }), description: 'Automated login steps' },
  { value: 'basic-auth', label: 'Basic Auth', icon: React.createElement(Lock, { size: 20 }), description: 'HTTP Basic Auth' },
];

export const defaultFormData: ProfileFormData = {
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
