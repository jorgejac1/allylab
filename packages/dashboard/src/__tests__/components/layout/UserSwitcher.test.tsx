/**
 * Tests for UserSwitcher Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSwitcher } from '../../../components/layout/UserSwitcher';
import * as authContextModule from '../../../contexts/AuthContext';

// Mock the auth context
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUser = {
  id: 'user_admin',
  email: 'admin@acme.com',
  name: 'Alice Admin',
  role: 'admin' as const,
  organizationId: 'org_acme',
  createdAt: '2024-01-15T10:00:00Z',
};

const mockUsers = [
  mockUser,
  {
    id: 'user_dev',
    email: 'dev@acme.com',
    name: 'Dana Developer',
    role: 'developer' as const,
    organizationId: 'org_acme',
    createdAt: '2024-01-17T10:00:00Z',
  },
];

describe('UserSwitcher', () => {
  const mockSwitchUser = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when no user is authenticated', () => {
    it('renders nothing', () => {
      vi.mocked(authContextModule.useAuth).mockReturnValue({
        user: null,
        allUsers: [],
        switchUser: mockSwitchUser,
        hasWebsiteSession: false,
        logout: mockLogout,
      } as any);

      const { container } = render(<UserSwitcher />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when user is logged in from website', () => {
    beforeEach(() => {
      vi.mocked(authContextModule.useAuth).mockReturnValue({
        user: mockUser,
        allUsers: [],
        switchUser: mockSwitchUser,
        hasWebsiteSession: true,
        logout: mockLogout,
      } as any);
    });

    it('displays user name and role', () => {
      render(<UserSwitcher />);

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    it('shows user menu with email and logout on click', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Signed in as')).toBeInTheDocument();
      expect(screen.getByText('admin@acme.com')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('does not show user switching options', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.queryByText('Switch User (Dev Mode)')).not.toBeInTheDocument();
      expect(screen.queryByText('Dana Developer')).not.toBeInTheDocument();
    });

    it('calls logout when Sign out is clicked', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('when user is in dev mode (direct dashboard access)', () => {
    beforeEach(() => {
      vi.mocked(authContextModule.useAuth).mockReturnValue({
        user: mockUser,
        allUsers: mockUsers,
        switchUser: mockSwitchUser,
        hasWebsiteSession: false,
        logout: mockLogout,
      } as any);
    });

    it('displays user name and role', () => {
      render(<UserSwitcher />);

      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    it('shows chevron icon for dropdown', () => {
      render(<UserSwitcher />);

      // The ChevronDown icon should be present
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('shows user list when clicked', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Switch User (Dev Mode)')).toBeInTheDocument();
      expect(screen.getByText('Dana Developer')).toBeInTheDocument();
    });

    it('calls switchUser when a different user is selected', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const devUserButton = screen.getByText('Dana Developer').closest('button');
      fireEvent.click(devUserButton!);

      expect(mockSwitchUser).toHaveBeenCalledWith('user_dev');
    });

    it('shows selected indicator for current user', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const adminOption = screen.getByRole('option', { selected: true });
      expect(adminOption).toBeInTheDocument();
    });

    it('shows footer hint', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Role changes apply immediately')).toBeInTheDocument();
    });
  });

  describe('dropdown behavior', () => {
    beforeEach(() => {
      vi.mocked(authContextModule.useAuth).mockReturnValue({
        user: mockUser,
        allUsers: mockUsers,
        switchUser: mockSwitchUser,
        hasWebsiteSession: false,
        logout: mockLogout,
      } as any);
    });

    it('closes dropdown when clicking outside', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Switch User (Dev Mode)')).toBeInTheDocument();

      // Simulate clicking outside
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Switch User (Dev Mode)')).not.toBeInTheDocument();
    });

    it('toggles dropdown on button click', () => {
      render(<UserSwitcher />);

      const button = screen.getByRole('button');

      // Open
      fireEvent.click(button);
      expect(screen.getByText('Switch User (Dev Mode)')).toBeInTheDocument();

      // Close
      fireEvent.click(button);
      expect(screen.queryByText('Switch User (Dev Mode)')).not.toBeInTheDocument();
    });
  });

  describe('role colors', () => {
    const testRoleColor = (role: string, expectedColor: string) => {
      vi.mocked(authContextModule.useAuth).mockReturnValue({
        user: { ...mockUser, role },
        allUsers: [],
        switchUser: mockSwitchUser,
        hasWebsiteSession: true,
        logout: mockLogout,
      } as any);

      render(<UserSwitcher />);
      const avatar = screen.getByTestId('user-avatar');

      // Check that the style attribute contains the expected color
      expect(avatar.getAttribute('style')).toContain(expectedColor);
    };

    it('shows red for admin role', () => {
      testRoleColor('admin', 'rgb(239, 68, 68)');
    });

    it('shows purple for manager role', () => {
      testRoleColor('manager', 'rgb(139, 92, 246)');
    });

    it('shows blue for developer role', () => {
      testRoleColor('developer', 'rgb(59, 130, 246)');
    });

    it('shows gray for viewer role', () => {
      testRoleColor('viewer', 'rgb(107, 114, 128)');
    });

    it('shows green for compliance role', () => {
      testRoleColor('compliance', 'rgb(16, 185, 129)');
    });
  });
});
