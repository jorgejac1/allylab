import type { ReactNode } from "react";

type ApiStatus = "connected" | "disconnected" | "checking";

interface NavItem {
  id: string;
  label: string;
  icon: string;
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
      style={{
        width: collapsed ? 64 : 240,
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        flexShrink: 0,
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 12px" : "20px 16px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>🔬</span>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>AllyLab</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Accessibility Scanner
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", overflow: "auto" }}>
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} style={{ marginBottom: 16 }}>
            {/* Group Title */}
            {group.title && !collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "8px 12px",
                }}
              >
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: collapsed ? "12px" : "10px 12px",
                    background: isActive ? "#1e293b" : "transparent",
                    border: "none",
                    borderRadius: 8,
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    color: item.disabled
                      ? "#475569"
                      : isActive
                      ? "#fff"
                      : "#94a3b8",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    textAlign: "left",
                    marginBottom: 4,
                    transition: "all 0.2s",
                    justifyContent: collapsed ? "center" : "flex-start",
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isActive ? "#2563eb" : "#334155",
                            color: "#fff",
                          }}
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
        <div style={{ padding: 16, borderTop: "1px solid #1e293b" }}>
          {footer}
        </div>
      )}

      {/* Version & API Status */}
      {!collapsed && (
        <div style={{ marginTop: "auto" }}>
          {/* Version */}
          <div
            style={{
              padding: "8px 16px",
              fontSize: 10,
              color: "#475569",
              borderTop: "1px solid #1e293b",
            }}
          >
            AllyLab v1.0.0
          </div>

          {/* API Status */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #1e293b",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: statusColors[apiStatus],
                boxShadow: `0 0 6px ${statusColors[apiStatus]}`,
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {statusLabels[apiStatus]}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}