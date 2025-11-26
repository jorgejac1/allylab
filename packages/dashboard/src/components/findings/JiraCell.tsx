import { useState } from 'react';

interface JiraCellProps {
  issueKey?: string;
  isLinking: boolean;
  linkInput: string;
  onLinkInputChange: (value: string) => void;
  onStartLink: () => void;
  onSaveLink: () => void;
  onCancelLink: () => void;
  onRemoveLink: () => void;
}

export function JiraCell({
  issueKey,
  isLinking,
  linkInput,
  onLinkInputChange,
  onStartLink,
  onSaveLink,
  onCancelLink,
  onRemoveLink,
}: JiraCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isLinking) {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          type="text"
          value={linkInput}
          onChange={e => onLinkInputChange(e.target.value)}
          placeholder="PROJ-123"
          autoFocus
          style={{
            width: 80,
            padding: '4px 8px',
            fontSize: 11,
            border: '1px solid #3b82f6',
            borderRadius: 4,
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') onSaveLink();
            if (e.key === 'Escape') onCancelLink();
          }}
        />
        <button
          onClick={onSaveLink}
          style={{
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 10,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#059669')}
          onMouseOut={e => (e.currentTarget.style.background = '#10b981')}
        >
          ✓
        </button>
        <button
          onClick={onCancelLink}
          style={{
            background: '#f1f5f9',
            color: '#64748b',
            border: 'none',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 10,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseOut={e => (e.currentTarget.style.background = '#f1f5f9')}
        >
          ✕
        </button>
      </div>
    );
  }

  if (issueKey) {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <a
          href="#"
          onClick={e => e.preventDefault()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            background: '#dbeafe',
            color: '#1d4ed8',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.15s',
            border: '1px solid transparent',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#bfdbfe';
            e.currentTarget.style.borderColor = '#93c5fd';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#dbeafe';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          title={`View ${issueKey} in JIRA`}
        >
          🔗 {issueKey}
        </a>
        <button
          onClick={onRemoveLink}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 12,
            padding: 2,
            borderRadius: 4,
            transition: 'all 0.15s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseOut={e => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'none';
          }}
          title="Remove link"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartLink}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? '#f1f5f9' : '#f8fafc',
        border: `1px dashed ${isHovered ? '#94a3b8' : '#d1d5db'}`,
        borderRadius: 4,
        padding: '4px 10px',
        fontSize: 11,
        color: isHovered ? '#475569' : '#64748b',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 10 }}>+</span> Link
    </button>
  );
}