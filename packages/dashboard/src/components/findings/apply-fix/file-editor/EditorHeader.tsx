import { Edit3 } from 'lucide-react';

interface EditorHeaderProps {
  filePath: string;
  onBack: () => void;
}

export function EditorHeader({ filePath, onBack }: EditorHeaderProps) {
  const fileName = filePath.split('/').pop();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <h3 style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <Edit3 size={14} aria-hidden="true" /> Edit: {fileName}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          {filePath}
        </p>
      </div>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
    </div>
  );
}
