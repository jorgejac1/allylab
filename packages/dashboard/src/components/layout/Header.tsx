import { Microscope, Check, X } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  apiStatus?: "connected" | "disconnected" | "checking";
}

export function Header({
  title = "AllyLab",
  subtitle = "Enterprise accessibility scanner",
  apiStatus = "connected",
}: HeaderProps) {
  const statusColors = {
    connected: "#10b981",
    disconnected: "#ef4444",
    checking: "#f59e0b",
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {/* Logo & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Microscope size={28} style={{ color: '#2563eb' }} />
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              color: "#0f172a",
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* API Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "#f8fafc",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
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
          <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b", display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            API{" "}
            {apiStatus === "connected"
              ? <Check size={12} />
              : apiStatus === "checking"
              ? "..."
              : <X size={12} />}
          </span>
        </div>

        {/* GitHub Link */}
        <a
          href="https://github.com/jorgejac1/allylab"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#0f172a",
            color: "#fff",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <GitHubIcon size={16} />
          GitHub
        </a>
      </div>
    </header>
  );
}

function GitHubIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
