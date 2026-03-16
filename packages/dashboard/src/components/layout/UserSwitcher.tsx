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
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 py-2 px-3 bg-transparent border border-slate-700 rounded-lg cursor-pointer text-slate-200 text-[13px]/[normal] min-w-[180px]"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {/* Avatar */}
          <div
            data-testid="user-avatar"
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
              border: `2px solid ${roleColor}`,
            }}
          >
            <RoleIcon size={14} color={roleColor} />
          </div>

          {/* User info */}
          <div className="flex-1 text-left">
            <div className="font-medium text-xs/[1.2]">{user.name}</div>
            <div className="text-[10px]/[normal]" style={{ color: roleColor }}>{ROLE_LABELS[user.role]}</div>
          </div>

          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* User menu (not switcher) */}
        {isOpen && (
          <div
            role="menu"
            className="absolute bottom-[calc(100%_+_4px)] left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-[0_-10px_25px_rgba(0,0,0,0.3)] z-[100] overflow-hidden"
          >
            {/* User info header */}
            <div className="p-3 border-b border-slate-700">
              <div className="text-xs/[normal] text-slate-400 mb-1">Signed in as</div>
              <div className="text-[13px]/[normal] font-medium text-slate-200">{user.email}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              role="menuitem"
              className="flex items-center gap-2 w-full py-2.5 px-3 bg-transparent border-0 cursor-pointer text-red-500 text-[13px]/[normal] text-left transition-colors duration-150 hover:bg-[#293548]"
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
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 py-2 px-3 bg-transparent border border-slate-700 rounded-lg text-slate-200 text-[13px]/[normal] min-w-[180px] ${
          canSwitchUsers ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={!canSwitchUsers}
      >
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
            border: `2px solid ${roleColor}`,
          }}
        >
          <RoleIcon size={14} color={roleColor} />
        </div>

        {/* User info */}
        <div className="flex-1 text-left">
          <div className="font-medium text-xs/[1.2]">{user.name}</div>
          <div className="text-[10px]/[normal]" style={{ color: roleColor }}>{ROLE_LABELS[user.role]}</div>
        </div>

        {canSwitchUsers && (
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown - only when switching is available */}
      {isOpen && canSwitchUsers && (
        <div
          role="listbox"
          className="absolute bottom-[calc(100%_+_4px)] left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-[0_-10px_25px_rgba(0,0,0,0.3)] z-[100] overflow-hidden min-w-[220px]"
        >
          {/* Header */}
          <div className="py-2 px-3 border-b border-slate-700 text-[10px]/[normal] text-slate-500 uppercase tracking-wide">
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
                className={`flex items-center gap-2.5 w-full py-2.5 px-3 border-0 cursor-pointer text-slate-200 text-[13px]/[normal] text-left transition-colors duration-150 ${
                  isSelected ? 'bg-slate-700' : 'bg-transparent hover:bg-[#293548]'
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                    border: `2px solid ${color}`,
                  }}
                >
                  <Icon size={14} color={color} />
                </div>

                {/* User info */}
                <div className="flex-1">
                  <div className="font-medium text-[13px]/[normal]">{u.name}</div>
                  <div className="text-[11px]/[normal]" style={{ color }}>{ROLE_LABELS[u.role]}</div>
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
            className="flex items-center gap-2 w-full py-2.5 px-3 bg-transparent border-0 border-t border-slate-700 cursor-pointer text-red-500 text-[13px]/[normal] text-left transition-colors duration-150 hover:bg-[#293548]"
          >
            <LogOut size={16} />
            Sign out
          </button>

          {/* Footer hint */}
          <div className="py-2 px-3 border-t border-slate-700 text-[10px]/[normal] text-slate-500 text-center rounded-b-lg bg-slate-800">
            Role changes apply immediately
          </div>
        </div>
      )}
    </div>
  );
}
