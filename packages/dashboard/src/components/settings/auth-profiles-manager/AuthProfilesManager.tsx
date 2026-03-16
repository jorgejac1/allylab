import { useState } from 'react';
import { Modal } from '../../ui';
import type { AuthProfile } from '../../../types/auth';
import {
  getAuthProfiles,
  saveAuthProfile,
  deleteAuthProfile,
  toggleProfileEnabled,
  validateAuthProfile,
  exportProfiles,
} from '../../../utils/authProfiles';
import { defaultFormData } from './constants';
import { ProfilesHeader } from './ProfilesHeader';
import { AuthProfileList } from './AuthProfileList';
import { AuthProfileForm } from './AuthProfileForm';
import { TestModal } from './TestModal';
import { ImportModal } from './ImportModal';
import type { ProfileFormData } from './types';

export function AuthProfilesManager() {
  const [profiles, setProfiles] = useState<AuthProfile[]>(() => getAuthProfiles());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [errors, setErrors] = useState<string[]>([]);

  // Test modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testingProfile, setTestingProfile] = useState<AuthProfile | null>(null);

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);

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
    const domains = formData.domains.split(',').map(d => d.trim()).filter(Boolean);

    const profile: Partial<AuthProfile> = {
      id: editingId || undefined,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      domains,
      method: formData.method,
      enabled: true,
    };

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

    const validationErrors = validateAuthProfile(profile);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

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

  const handleOpenTest = (profile: AuthProfile) => {
    setTestingProfile(profile);
    setTestModalOpen(true);
  };

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

  return (
    <div className="flex flex-col gap-6">
      <ProfilesHeader
        profilesCount={profiles.length}
        onExport={handleExport}
        onImport={() => setImportModalOpen(true)}
        onCreate={handleOpenCreate}
      />

      <AuthProfileList
        profiles={profiles}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onTest={handleOpenTest}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Authentication Profile' : 'New Authentication Profile'}
      >
        <AuthProfileForm
          formData={formData}
          errors={errors}
          editingId={editingId}
          onFormDataChange={setFormData}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      <TestModal
        isOpen={testModalOpen}
        onClose={() => {
          setTestModalOpen(false);
          // Refresh profiles to pick up test result updates
          setProfiles(getAuthProfiles());
        }}
        profile={testingProfile}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => setProfiles(getAuthProfiles())}
      />
    </div>
  );
}
