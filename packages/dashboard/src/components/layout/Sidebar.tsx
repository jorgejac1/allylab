import type { ReactNode } from "react";
import { Microscope } from 'lucide-react';

type ApiStatus = "connected" | "disconnected" | "checking";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  activeItem: string;
  onItemClick: (id: string) => void;
  collapsed?: boolean;
  footer?: ReactNode;
  apiStatus?: ApiStatus;
}

export function Sidebar({
  groups,
  activeItem,
  onItemClick,
  collapsed = false,
  footer,
  apiStatus = "connected",
}: SidebarProps) {
  const statusColors: Record<ApiStatus, string> = {
    connected: "#10b981",
    disconnected: "#ef4444",
    checking: "#f59e0b",
  };

  const statusLabels: Record<ApiStatus, string> = {
    connected: "API Connected",
    disconnected: "API Disconnected",
    checking: "Checking...",
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} bg-slate-900 text-white flex flex-col transition-[width] duration-200 shrink-0 min-h-screen sticky top-0 self-start`}
    >
      {/* Logo */}
      <div
        className={`${collapsed ? 'py-5 px-3' : 'py-5 px-4'} border-b border-slate-800 flex items-center gap-3`}
      >
        <Microscope size={28} aria-hidden="true" />
        {!collapsed && (
          <div>
            <div className="text-lg/[normal] font-bold">AllyLab</div>
            <div className="text-[11px]/[normal] text-slate-400">
              Accessibility Scanner
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        id="main-navigation"
        aria-label="Main navigation"
        tabIndex={-1}
        className="flex-1 py-3 px-2 overflow-auto outline-none"
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {/* Group Title */}
            {group.title && !collapsed && (
              <div className="text-[10px]/[normal] font-semibold text-slate-400 uppercase tracking-wide py-2 px-3">
                {group.title}
              </div>
            )}

            {/* Items */}
            {group.items.map((item) => {
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && onItemClick(item.id)}
                  disabled={item.disabled}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 w-full ${collapsed ? 'p-3 justify-center' : 'py-2.5 px-3 justify-start'} ${
                    isActive ? 'bg-slate-800' : 'bg-transparent'
                  } border-0 rounded-lg text-sm/[normal] text-left mb-1 transition-all ${
                    item.disabled
                      ? 'cursor-not-allowed text-slate-600 opacity-50'
                      : isActive
                      ? 'cursor-pointer text-white font-semibold'
                      : 'cursor-pointer text-slate-400 font-normal'
                  }`}
                >
                  <span className="flex items-center justify-center" aria-hidden="true">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`py-0.5 px-2 rounded-[10px] text-[11px]/[normal] font-semibold text-white ${
                            isActive ? 'bg-blue-600' : 'bg-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-slate-800">
          {footer}
        </div>
      )}

      {/* Version & API Status */}
      {!collapsed && (
        <div className="mt-auto">
          {/* Version */}
          <div className="py-2 px-4 text-[10px]/[normal] text-slate-400 border-t border-slate-800">
            AllyLab v1.0.0
          </div>

          {/* API Status */}
          <div className="py-3 px-4 border-t border-slate-800 flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: statusColors[apiStatus],
                boxShadow: `0 0 6px ${statusColors[apiStatus]}`,
              }}
            />
            <span className="text-xs/[normal] text-slate-400">
              {statusLabels[apiStatus]}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
