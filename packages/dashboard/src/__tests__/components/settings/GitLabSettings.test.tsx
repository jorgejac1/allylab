/**
 * GitLabSettings Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitLabSettings } from '../../../components/settings/GitLabSettings';
import type { GitLabConnection } from '../../../types/gitlab';

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

describe('GitLabSettings', () => {
  const mockOnConnect = vi.fn();
  const mockOnDisconnect = vi.fn();

  const disconnectedConnection: GitLabConnection = {
    connected: false,
  };

  const connectedConnection: GitLabConnection = {
    connected: true,
    provider: 'gitlab',
    instanceUrl: 'https://gitlab.com',
    user: {
      id: 12345,
      username: 'testuser',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.png',
      web_url: 'https://gitlab.com/testuser',
    },
    projects: [
      { id: 1, name: 'project-1', path_with_namespace: 'testuser/project-1', visibility: 'public' },
      { id: 2, name: 'project-2', path_with_namespace: 'testuser/project-2', visibility: 'private' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={true}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByText(/loading gitlab connection/i)).toBeInTheDocument();
    });
  });

  describe('Disconnected State', () => {
    it('shows connect button when not connected', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByRole('button', { name: /connect gitlab/i })).toBeInTheDocument();
    });

    it('shows token input when connect button is clicked', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /connect gitlab/i }));

      expect(screen.getByPlaceholderText(/glpat-/i)).toBeInTheDocument();
    });

    it('shows self-hosted option checkbox', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /connect gitlab/i }));

      expect(screen.getByText(/self-hosted gitlab/i)).toBeInTheDocument();
    });

    it('shows instance URL input when self-hosted is checked', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /connect gitlab/i }));
      fireEvent.click(screen.getByRole('checkbox'));

      expect(screen.getByPlaceholderText(/gitlab\.yourcompany\.com/i)).toBeInTheDocument();
    });

    it('calls onConnect with token and default URL', async () => {
      mockOnConnect.mockResolvedValue(true);

      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /connect gitlab/i }));
      fireEvent.change(screen.getByPlaceholderText(/glpat-/i), {
        target: { value: 'glpat-test-token' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));

      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenCalledWith('glpat-test-token', 'https://gitlab.com');
      });
    });

    it('calls onConnect with custom instance URL', async () => {
      mockOnConnect.mockResolvedValue(true);

      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /connect gitlab/i }));
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.change(screen.getByPlaceholderText(/gitlab\.yourcompany\.com/i), {
        target: { value: 'https://gitlab.mycompany.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/glpat-/i), {
        target: { value: 'glpat-test-token' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));

      await waitFor(() => {
        expect(mockOnConnect).toHaveBeenCalledWith('glpat-test-token', 'https://gitlab.mycompany.com');
      });
    });

    it('hides token input on cancel', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /connect gitlab/i }));
      expect(screen.getByPlaceholderText(/glpat-/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByPlaceholderText(/glpat-/i)).not.toBeInTheDocument();
    });

    it('shows error message when error prop is set', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error="Invalid token format"
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByText('Invalid token format')).toBeInTheDocument();
    });
  });

  describe('Connected State', () => {
    it('shows connected user information', () => {
      render(
        <GitLabSettings
          connection={connectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });

    it('shows user avatar', () => {
      render(
        <GitLabSettings
          connection={connectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      const avatar = screen.getByAltText('testuser');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
    });

    it('shows project count', () => {
      render(
        <GitLabSettings
          connection={connectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByText(/access to 2 projects/i)).toBeInTheDocument();
    });

    it('shows disconnect button', () => {
      render(
        <GitLabSettings
          connection={connectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByRole('button', { name: /disconnect gitlab/i })).toBeInTheDocument();
    });

    it('calls onDisconnect when disconnect is confirmed', async () => {
      mockConfirm.mockReturnValue(true);

      render(
        <GitLabSettings
          connection={connectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /disconnect gitlab/i }));

      await waitFor(() => {
        expect(mockOnDisconnect).toHaveBeenCalled();
      });
    });

    it('does not call onDisconnect when disconnect is cancelled', async () => {
      mockConfirm.mockReturnValue(false);

      render(
        <GitLabSettings
          connection={connectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /disconnect gitlab/i }));

      expect(mockOnDisconnect).not.toHaveBeenCalled();
    });

    it('shows self-hosted instance URL for non-gitlab.com connections', () => {
      const selfHostedConnection: GitLabConnection = {
        ...connectedConnection,
        instanceUrl: 'https://gitlab.mycompany.com',
      };

      render(
        <GitLabSettings
          connection={selfHostedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByText('https://gitlab.mycompany.com')).toBeInTheDocument();
    });
  });

  describe('Token Instructions', () => {
    it('shows expandable token instructions', () => {
      render(
        <GitLabSettings
          connection={disconnectedConnection}
          isLoading={false}
          error={null}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      expect(screen.getByText(/how to create a gitlab personal access token/i)).toBeInTheDocument();
    });
  });
});
