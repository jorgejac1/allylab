'use client';

import { DEMO_ACCOUNTS, ROLE_LABELS } from '@/lib/auth/mock';
import { Shield, User, Code, Eye, FileCheck } from 'lucide-react';

const ROLE_ICONS = {
  admin: Shield,
  manager: User,
  developer: Code,
  viewer: Eye,
  compliance: FileCheck,
};

const ROLE_COLORS = {
  admin: 'text-red-400 bg-red-400/10 border-red-400/30',
  manager: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  developer: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  viewer: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  compliance: 'text-green-400 bg-green-400/10 border-green-400/30',
};

interface DemoAccountsProps {
  onSelect: (email: string, password: string) => void;
}

export function DemoAccounts({ onSelect }: DemoAccountsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted uppercase tracking-wide">Demo Accounts</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-2">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = ROLE_ICONS[account.role];
          const colorClass = ROLE_COLORS[account.role];

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(account.email, account.password)}
              className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-lg hover:border-primary/50 hover:bg-surface transition-all text-left group"
            >
              <div className={`p-2 rounded-lg border ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{account.name}</div>
                <div className="text-xs text-text-muted truncate">{account.email}</div>
              </div>
              <div className={`text-xs px-2 py-1 rounded border ${colorClass}`}>
                {ROLE_LABELS[account.role]}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted text-center">
        Click any account to auto-fill credentials
      </p>
    </div>
  );
}
