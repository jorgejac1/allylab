import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Shield, Code, Eye, FileCheck, Check, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts';
import type { Role } from '../../types/auth';
import { ROLE_LABELS } from '../../utils/permissions';

const ROLE_ICONS: Record<Role, typeof User> = {
  admin: Shield,
  manager: User,
  developer: Code,
  viewer: Eye,
  compliance: FileCheck,
};

const ROLE_COLORS: Record<Role, string> = {
  admin: '#ef4444',
  manager: '#8b5cf6',
  developer: '#3b82f6',
  viewer: '#6b7280',
  compliance: '#10b981',
};

/**
 * User switcher dropdown for development mode.
 * Allows switching between mock users to test different role permissions.
 * When logged in from website, shows user info with logout option instead of switcher.
 */
export function UserSwitcher() {
  const { user, allUsers, switchUser, hasWebsiteSession, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const RoleIcon = ROLE_ICONS[user.role];
  const roleColor = ROLE_COLORS[user.role];
  const canSwitchUsers = allUsers.length > 0 && !hasWebsiteSession;

  // When logged in from website, show simplified user display with logout
  if (hasWebsiteSession) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#e2e8f0',
            fontSize: 13,
            minWidth: 180,
          }}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {/* Avatar */}
          <div
            data-testid="user-avatar"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
              border: `2px solid ${roleColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RoleIcon size={14} color={roleColor} />
          </div>

          {/* User info */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: 10, color: roleColor }}>{ROLE_LABELS[user.role]}</div>
          </div>

          <ChevronDown
            size={14}
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            }}
          />
        </button>

        {/* User menu (not switcher) */}
        {isOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.3)',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {/* User info header */}
            <div
              style={{
                padding: '12px',
                borderBottom: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Signed in as</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{user.email}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              role="menuitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: 13,
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#293548';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Dev mode: Full user switcher dropdown
  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid #334155',
          borderRadius: 8,
          cursor: canSwitchUsers ? 'pointer' : 'default',
          color: '#e2e8f0',
          fontSize: 13,
          minWidth: 180,
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={!canSwitchUsers}
      >
        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
            border: `2px solid ${roleColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RoleIcon size={14} color={roleColor} />
        </div>

        {/* User info */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.2 }}>{user.name}</div>
          <div style={{ fontSize: 10, color: roleColor }}>{ROLE_LABELS[user.role]}</div>
        </div>

        {canSwitchUsers && (
          <ChevronDown
            size={14}
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            }}
          />
        )}
      </button>

      {/* Dropdown - only when switching is available */}
      {isOpen && canSwitchUsers && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: 100,
            overflow: 'hidden',
            minWidth: 220,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #334155',
              fontSize: 10,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Switch User (Dev Mode)
          </div>

          {/* User List */}
          {allUsers.map((u) => {
            const Icon = ROLE_ICONS[u.role];
            const color = ROLE_COLORS[u.role];
            const isSelected = u.id === user.id;

            return (
              <button
                key={u.id}
                onClick={() => {
                  switchUser(u.id);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={isSelected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  background: isSelected ? '#334155' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#e2e8f0',
                  fontSize: 13,
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#293548';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={14} color={color} />
                </div>

                {/* User info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: color }}>{ROLE_LABELS[u.role]}</div>
                </div>

                {/* Selected indicator */}
                {isSelected && <Check size={16} color="#10b981" />}
              </button>
            );
          })}

          {/* Sign out button */}
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 12px',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid #334155',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: 13,
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#293548';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>

          {/* Footer hint */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #334155',
              fontSize: 10,
              color: '#64748b',
              textAlign: 'center',
              borderRadius: '0 0 8px 8px',
              background: '#1e293b',
            }}
          >
            Role changes apply immediately
          </div>
        </div>
      )}
    </div>
  );
}
