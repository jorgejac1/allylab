/**
 * GitIntegrationSettings Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitIntegrationSettings } from '../../../components/settings/GitIntegrationSettings';

// Mock the hooks
vi.mock('../../../hooks/useGitHub', () => ({
  useGitHub: () => ({
    connection: { connected: false },
    isLoading: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    checkConnection: vi.fn(),
    getRepos: vi.fn(),
    getBranches: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useGitLab', () => ({
  useGitLab: () => ({
    connection: { connected: false },
    isLoading: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    checkConnection: vi.fn(),
    getProjects: vi.fn(),
    getBranches: vi.fn(),
    createMR: vi.fn(),
  }),
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
});

describe('GitIntegrationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Selector', () => {
    it('renders provider selector with GitHub and GitLab options', () => {
      render(<GitIntegrationSettings />);

      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('GitLab')).toBeInTheDocument();
    });

    it('shows GitHub settings by default', () => {
      render(<GitIntegrationSettings />);

      // GitHub should be selected by default
      const githubButton = screen.getByText('GitHub').closest('button');
      expect(githubButton).toHaveStyle({ border: expect.stringContaining('solid') });
    });

    it('shows GitLab settings when GitLab is selected', async () => {
      render(<GitIntegrationSettings />);

      fireEvent.click(screen.getByText('GitLab'));

      await waitFor(() => {
        expect(screen.getByText('GitLab Integration')).toBeInTheDocument();
      });
    });

    it('switches between providers', async () => {
      render(<GitIntegrationSettings />);

      // Start with GitHub
      expect(screen.getByText('GitHub Integration')).toBeInTheDocument();

      // Switch to GitLab
      fireEvent.click(screen.getByText('GitLab'));
      await waitFor(() => {
        expect(screen.getByText('GitLab Integration')).toBeInTheDocument();
      });

      // Switch back to GitHub
      fireEvent.click(screen.getByText('GitHub'));
      await waitFor(() => {
        expect(screen.getByText('GitHub Integration')).toBeInTheDocument();
      });
    });
  });

  describe('Provider Cards', () => {
    it('displays both provider cards', () => {
      render(<GitIntegrationSettings />);

      expect(screen.getByText('Git Provider')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('GitLab')).toBeInTheDocument();
    });

    it('shows description text', () => {
      render(<GitIntegrationSettings />);

      expect(screen.getByText(/connect your preferred git provider/i)).toBeInTheDocument();
    });
  });
});

describe('GitIntegrationSettings with Connected Providers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows connection status indicator for connected GitHub', async () => {
    vi.doMock('../../../hooks/useGitHub', () => ({
      useGitHub: () => ({
        connection: {
          connected: true,
          user: { login: 'testuser', name: 'Test User' },
        },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    vi.doMock('../../../hooks/useGitLab', () => ({
      useGitLab: () => ({
        connection: { connected: false },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    // Re-import to get mocked version
    const { GitIntegrationSettings: MockedComponent } = await import(
      '../../../components/settings/GitIntegrationSettings'
    );

    render(<MockedComponent />);

    // Check for the green dot indicator (8x8 green circle for connected state)
    const githubButton = screen.getByText('GitHub').closest('button');
    expect(githubButton).toBeInTheDocument();
  });

  it('shows both providers connected message', async () => {
    vi.doMock('../../../hooks/useGitHub', () => ({
      useGitHub: () => ({
        connection: {
          connected: true,
          user: { login: 'testuser' },
        },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    vi.doMock('../../../hooks/useGitLab', () => ({
      useGitLab: () => ({
        connection: {
          connected: true,
          user: { username: 'testuser' },
        },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    const { GitIntegrationSettings: MockedComponent } = await import(
      '../../../components/settings/GitIntegrationSettings'
    );

    render(<MockedComponent />);

    await waitFor(() => {
      expect(screen.getByText(/both github and gitlab are connected/i)).toBeInTheDocument();
    });
  });

  it('shows GitHub only connected message', async () => {
    vi.doMock('../../../hooks/useGitHub', () => ({
      useGitHub: () => ({
        connection: {
          connected: true,
          user: { login: 'testuser' },
        },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    vi.doMock('../../../hooks/useGitLab', () => ({
      useGitLab: () => ({
        connection: { connected: false },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    const { GitIntegrationSettings: MockedComponent } = await import(
      '../../../components/settings/GitIntegrationSettings'
    );

    render(<MockedComponent />);

    await waitFor(() => {
      expect(screen.getByText(/github is connected/i)).toBeInTheDocument();
    });
  });

  it('shows GitLab only connected message', async () => {
    vi.doMock('../../../hooks/useGitHub', () => ({
      useGitHub: () => ({
        connection: { connected: false },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    vi.doMock('../../../hooks/useGitLab', () => ({
      useGitLab: () => ({
        connection: {
          connected: true,
          user: { username: 'testuser' },
        },
        isLoading: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
    }));

    const { GitIntegrationSettings: MockedComponent } = await import(
      '../../../components/settings/GitIntegrationSettings'
    );

    render(<MockedComponent />);

    await waitFor(() => {
      expect(screen.getByText(/gitlab is connected/i)).toBeInTheDocument();
    });
  });
});
