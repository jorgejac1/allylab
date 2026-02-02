import { useState, lazy, Suspense } from 'react';
import { PageContainer } from '../../components/layout';
import { Tabs, ConfirmDialog, Toast, TabLoader } from '../../components/ui';
import { useLocalStorage, useConfirmDialog, useToast } from '../../hooks';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { APISettings } from './APISettings';
import { DEFAULT_SETTINGS, TABS } from './constants';
import type { Settings, TabId } from './types';

// Lazy load settings tabs for better initial load performance
const CICDGenerator = lazy(() => import('../../components/settings/CICDGenerator').then(m => ({ default: m.CICDGenerator })));
const JiraSettings = lazy(() => import('../../components/settings/JiraSettings').then(m => ({ default: m.JiraSettings })));
const ScheduleManager = lazy(() => import('../../components/settings/ScheduleManager').then(m => ({ default: m.ScheduleManager })));
const WebhookManager = lazy(() => import('../../components/settings/WebhookManager').then(m => ({ default: m.WebhookManager })));
const GitIntegrationSettings = lazy(() => import('../../components/settings/GitIntegrationSettings').then(m => ({ default: m.GitIntegrationSettings })));
const AlertSettings = lazy(() => import('../../components/settings/AlertSettings').then(m => ({ default: m.AlertSettings })));
const ReportSettings = lazy(() => import('../../components/settings/ReportSettings').then(m => ({ default: m.ReportSettings })));
const CustomRulesManager = lazy(() => import('../../components/settings/CustomRulesManager').then(m => ({ default: m.CustomRulesManager })));
const TeamSettings = lazy(() => import('../../components/settings/TeamSettings').then(m => ({ default: m.TeamSettings })));
const BillingSettings = lazy(() => import('../../components/settings/BillingSettings').then(m => ({ default: m.BillingSettings })));
const AuthProfilesManager = lazy(() => import('../../components/settings/AuthProfilesManager').then(m => ({ default: m.AuthProfilesManager })));

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useLocalStorage<Settings>(
    'allylab_settings',
    DEFAULT_SETTINGS
  );
  const [saved, setSaved] = useState(false);

  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirmDialog();
  const { toasts, success, closeToast } = useToast();

  const handleChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    success('Settings saved successfully');
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all settings to their default values?',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
      variant: 'warning',
    });

    if (confirmed) {
      setSettings(DEFAULT_SETTINGS);
      setSaved(false);
      success('Settings reset to defaults');
    }
  };

  const handleClearData = async () => {
    const confirmed = await confirm({
      title: 'Clear All Data',
      message: 'Are you sure you want to clear all scan data and issue tracking history? This action cannot be undone.',
      confirmLabel: 'Clear Data',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      localStorage.removeItem('allylab_scans');
      localStorage.removeItem('allylab_tracked_issues');
      window.location.reload();
    }
  };

  return (
    <PageContainer
      title="Settings"
      subtitle="Configure your AllyLab preferences"
    >
      {/* Toast Container */}
      <Toast toasts={toasts} onClose={closeToast} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Tabs */}
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {/* General Settings */}
        {activeTab === 'general' && (
          <GeneralSettingsTab
            settings={settings}
            saved={saved}
            onChange={handleChange}
            onSave={handleSave}
            onReset={handleReset}
            onClearData={handleClearData}
          />
        )}

        {/* Team Settings */}
        {activeTab === 'team' && (
          <Suspense fallback={<TabLoader />}>
            <TeamSettings />
          </Suspense>
        )}

        {/* Billing Settings */}
        {activeTab === 'billing' && (
          <Suspense fallback={<TabLoader />}>
            <BillingSettings />
          </Suspense>
        )}

        {/* Custom Rules */}
        {activeTab === 'rules' && (
          <Suspense fallback={<TabLoader />}>
            <CustomRulesManager />
          </Suspense>
        )}

        {/* Alert Settings */}
        {activeTab === 'alerts' && (
          <Suspense fallback={<TabLoader />}>
            <AlertSettings />
          </Suspense>
        )}

        {/* Report Settings */}
        {activeTab === 'reports' && (
          <Suspense fallback={<TabLoader />}>
            <ReportSettings />
          </Suspense>
        )}

        {/* Scheduled Scans */}
        {activeTab === 'schedules' && (
          <Suspense fallback={<TabLoader />}>
            <ScheduleManager />
          </Suspense>
        )}

        {/* Authentication Profiles */}
        {activeTab === 'auth' && (
          <Suspense fallback={<TabLoader />}>
            <AuthProfilesManager />
          </Suspense>
        )}

        {/* Webhooks / Notifications */}
        {activeTab === 'webhooks' && (
          <Suspense fallback={<TabLoader />}>
            <WebhookManager />
          </Suspense>
        )}

        {/* JIRA Integration */}
        {activeTab === 'jira' && (
          <Suspense fallback={<TabLoader />}>
            <JiraSettings />
          </Suspense>
        )}

        {/* Git Integration (GitHub + GitLab) */}
        {activeTab === 'git' && (
          <Suspense fallback={<TabLoader />}>
            <GitIntegrationSettings />
          </Suspense>
        )}

        {/* CI/CD Integration */}
        {activeTab === 'cicd' && (
          <Suspense fallback={<TabLoader />}>
            <CICDGenerator />
          </Suspense>
        )}

        {/* API Settings */}
        {activeTab === 'api' && <APISettings />}
      </div>
    </PageContainer>
  );
}
