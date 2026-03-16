import { useState, useEffect } from 'react';
import { Button, Card, Modal } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { authConfig } from '../../config/auth';
import { Users, UserPlus, Shield, Trash2, AlertCircle, Crown, Loader2 } from 'lucide-react';
import type { Role, User } from '../../types/auth';

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
  viewer: 'Viewer',
  compliance: 'Compliance',
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access, can manage users and billing',
  manager: 'Can manage scans, integrations, and team settings',
  developer: 'Can run scans and create fixes',
  viewer: 'Read-only access to reports',
  compliance: 'Access to reports and auditing features',
};

interface TeamMember extends User {
  isOwner?: boolean;
}

export function TeamSettings() {
  const { user, organization, can, isMockAuth, allUsers } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('developer');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Role change state
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const canManageUsers = can('users:invite') || can('users:remove') || can('users:change-role');

  // Fetch team members
  useEffect(() => {
    async function fetchTeamMembers() {
      setIsLoading(true);
      setError(null);

      try {
        if (isMockAuth) {
          // In mock mode, use allUsers from context
          setMembers(allUsers.map(u => ({
            ...u,
            isOwner: u.id === 'user_admin',
          })));
        } else {
          // In production, fetch from API
          const response = await fetch(`${authConfig.apiUrl}/api/organizations/members`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to load team members');
          }

          const data = await response.json();
          setMembers(data.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeamMembers();
  }, [isMockAuth, allUsers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      if (isMockAuth) {
        // Mock: add a new user to the local list
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate a mock user
        const newMember: TeamMember = {
          id: `user_invited_${Date.now()}`,
          email: inviteEmail,
          name: inviteEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          role: inviteRole,
          organizationId: organization?.id || 'org_acme',
          createdAt: new Date().toISOString(),
          isOwner: false,
        };

        setMembers(prev => [...prev, newMember]);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('developer');
      } else {
        const response = await fetch(`${authConfig.apiUrl}/api/organizations/invite`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send invitation');
        }

        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('developer');
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: Role) => {
    setChangingRole(memberId);

    try {
      if (isMockAuth) {
        // Mock: just update locally
        await new Promise(resolve => setTimeout(resolve, 300));
        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
      } else {
        const response = await fetch(`${authConfig.apiUrl}/api/organizations/members/${memberId}/role`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });

        if (!response.ok) {
          throw new Error('Failed to update role');
        }

        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
      }
    } catch (err) {
      console.error('Failed to change role:', err);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      if (isMockAuth) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        const response = await fetch(`${authConfig.apiUrl}/api/organizations/members/${memberId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to remove member');
        }

        setMembers(prev => prev.filter(m => m.id !== memberId));
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-10 text-center text-slate-500">
          <Loader2 size={24} className="animate-spin mx-auto" />
          <p className="mt-3">Loading team members...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Organization Overview */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="m-0 text-base font-semibold flex items-center gap-2">
              <Users size={18} /> Team Members
            </h3>
            {organization && (
              <p className="mt-1 mb-0 text-sm text-slate-500">
                {organization.name} &middot; {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)} Plan &middot; {members.length} of {organization.settings.maxUsers === -1 ? 'Unlimited' : organization.settings.maxUsers} users
              </p>
            )}
          </div>
          {canManageUsers && (
            <Button onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-1.5">
              <UserPlus size={16} /> Invite Member
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Members List */}
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-3 border rounded-lg"
              style={{
                background: member.id === user?.id ? '#f0fdf4' : '#f8fafc',
                borderColor: member.id === user?.id ? '#bbf7d0' : '#e2e8f0',
              }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-base font-semibold text-slate-500 overflow-hidden">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" width={40} height={40} loading="lazy" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  {member.name}
                  {member.id === user?.id && (
                    <span className="py-0.5 px-2 bg-green-100 text-green-700 rounded-xl text-[11px] font-medium">
                      You
                    </span>
                  )}
                  {member.isOwner && (
                    <span title="Organization Owner"><Crown size={14} className="text-amber-500" /></span>
                  )}
                </div>
                <div className="text-sm text-slate-500">{member.email}</div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-2">
                {canManageUsers && member.id !== user?.id && !member.isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as Role)}
                    disabled={changingRole === member.id}
                    className="py-1.5 px-3 border border-slate-200 rounded-md text-sm bg-white cursor-pointer"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="py-1.5 px-3 bg-slate-200 rounded-md text-sm font-medium flex items-center gap-1">
                    <Shield size={12} /> {ROLE_LABELS[member.role]}
                  </span>
                )}

                {canManageUsers && member.id !== user?.id && !member.isOwner && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="p-1.5 border-none bg-transparent text-red-600 cursor-pointer rounded"
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <h3 className="mt-0 mb-4 text-base font-semibold">
          Role Permissions
        </h3>
        <div className="grid gap-3">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="flex items-start gap-3">
              <span
                className="py-1 px-2.5 rounded text-xs font-semibold min-w-[80px]"
                style={{
                  background: role === 'admin' ? '#fef3c7' : '#f1f5f9',
                  color: role === 'admin' ? '#92400e' : '#475569',
                }}
              >
                {label}
              </span>
              <span className="text-sm text-slate-500">
                {ROLE_DESCRIPTIONS[role as Role]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full py-2.5 px-3 border border-slate-200 rounded-md text-sm box-border"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-full py-2.5 px-3 border border-slate-200 rounded-md text-sm bg-white"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} - {ROLE_DESCRIPTIONS[value as Role]}
                </option>
              ))}
            </select>
          </div>

          {inviteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {inviteError}
            </div>
          )}

          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
