interface CodePreviewProps {
  original: string;
  fixed: string;
}

export function CodePreview({ original, fixed }: CodePreviewProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Original Code */}
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#dc2626',
          textTransform: 'uppercase',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
          Find This
        </div>
        <pre style={{
          margin: 0,
          padding: 12,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          overflow: 'auto',
          maxHeight: 150,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#991b1b',
        }}>
          {original}
        </pre>
      </div>

      {/* Fixed Code */}
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#16a34a',
          textTransform: 'uppercase',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
          Replace With
        </div>
        <pre style={{
          margin: 0,
          padding: 12,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 6,
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          overflow: 'auto',
          maxHeight: 150,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#166534',
        }}>
          {fixed}
        </pre>
      </div>
    </div>
  );
}