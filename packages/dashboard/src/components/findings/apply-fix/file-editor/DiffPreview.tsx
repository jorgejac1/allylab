interface DiffPreviewProps {
  originalCode: string;
  fixedCode: string;
}

export function DiffPreview({ originalCode, fixedCode }: DiffPreviewProps) {
  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <DiffHeader />
      <DiffContent originalCode={originalCode} fixedCode={fixedCode} />
    </div>
  );
}

function DiffHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontSize: 11,
      fontWeight: 600,
    }}>
      <div style={{
        padding: '6px 12px',
        background: '#fef2f2',
        color: '#991b1b',
        borderRight: '1px solid #e2e8f0',
      }}>
        ⊖ Current Code
      </div>
      <div style={{ padding: '6px 12px', background: '#f0fdf4', color: '#166534' }}>
        ⊕ Fixed Code (JSX)
      </div>
    </div>
  );
}

function DiffContent({
  originalCode,
  fixedCode,
}: {
  originalCode: string;
  fixedCode: string;
}) {
  const preStyle = {
    margin: 0,
    padding: 10,
    overflow: 'auto',
    maxHeight: 120,
    whiteSpace: 'pre-wrap' as const,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 11,
    lineHeight: 1.5,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      <pre style={{
        ...preStyle,
        background: '#fff5f5',
        borderRight: '1px solid #e2e8f0',
        color: '#991b1b',
      }}>
        {originalCode}
      </pre>
      <pre style={{
        ...preStyle,
        background: '#f0fff4',
        color: '#166534',
      }}>
        {fixedCode}
      </pre>
    </div>
  );
}
