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
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12 }}>Loading team members...</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Organization Overview */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} /> Team Members
            </h3>
            {organization && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                {organization.name} &middot; {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)} Plan &middot; {members.length} of {organization.settings.maxUsers === -1 ? 'Unlimited' : organization.settings.maxUsers} users
              </p>
            )}
          </div>
          {canManageUsers && (
            <Button onClick={() => setShowInviteModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={16} /> Invite Member
            </Button>
          )}
        </div>

        {error && (
          <div style={{
            padding: 12,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Members List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 12,
                background: member.id === user?.id ? '#f0fdf4' : '#f8fafc',
                border: '1px solid',
                borderColor: member.id === user?.id ? '#bbf7d0' : '#e2e8f0',
                borderRadius: 8,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 600,
                color: '#64748b',
                overflow: 'hidden',
              }}>
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {member.name}
                  {member.id === user?.id && (
                    <span style={{
                      padding: '2px 8px',
                      background: '#dcfce7',
                      color: '#15803d',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 500,
                    }}>
                      You
                    </span>
                  )}
                  {member.isOwner && (
                    <span title="Organization Owner"><Crown size={14} style={{ color: '#f59e0b' }} /></span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{member.email}</div>
              </div>

              {/* Role */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {canManageUsers && member.id !== user?.id && !member.isOwner ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as Role)}
                    disabled={changingRole === member.id}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 13,
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{
                    padding: '6px 12px',
                    background: '#e2e8f0',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Shield size={12} /> {ROLE_LABELS[member.role]}
                  </span>
                )}

                {canManageUsers && member.id !== user?.id && !member.isOwner && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    style={{
                      padding: 6,
                      border: 'none',
                      background: 'transparent',
                      color: '#dc2626',
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
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
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
          Role Permissions
        </h3>
        <div style={{ display: 'grid', gap: 12 }}>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{
                padding: '4px 10px',
                background: role === 'admin' ? '#fef3c7' : '#f1f5f9',
                color: role === 'admin' ? '#92400e' : '#475569',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                minWidth: 80,
              }}>
                {label}
              </span>
              <span style={{ fontSize: 13, color: '#64748b' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 14,
                background: 'white',
              }}
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} - {ROLE_DESCRIPTIONS[value as Role]}
                </option>
              ))}
            </select>
          </div>

          {inviteError && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 13,
            }}>
              {inviteError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
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
