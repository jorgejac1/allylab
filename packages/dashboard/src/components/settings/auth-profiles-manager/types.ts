import type { AuthProfile, AuthMethod } from '../../../types/auth';

export interface ProfileFormData {
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

export interface AuthProfileFormProps {
  formData: ProfileFormData;
  errors: string[];
  editingId: string | null;
  onFormDataChange: (data: ProfileFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

export interface AuthProfileListProps {
  profiles: AuthProfile[];
  onEdit: (profile: AuthProfile) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onTest: (profile: AuthProfile) => void;
}

export interface AuthProfileItemProps {
  profile: AuthProfile;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onTest: () => void;
}

export interface ProfilesHeaderProps {
  profilesCount: number;
  onExport: () => void;
  onImport: () => void;
  onCreate: () => void;
}

export interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AuthProfile | null;
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

export type { AuthProfile, AuthMethod };
