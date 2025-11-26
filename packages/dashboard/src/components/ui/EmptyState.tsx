import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: '#f8fafc',
        borderRadius: 12,
        border: '2px dashed #e2e8f0',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#0f172a' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', maxWidth: 400, marginInline: 'auto' }}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}