import { htmlToJsx } from '../../apply-fix/utils';

interface FixPreviewProps {
  originalCode: string;
  fixedCode: string;
}

export function FixPreview({ originalCode, fixedCode }: FixPreviewProps) {
  const fixedJsx = htmlToJsx(fixedCode);

  return (
    <div style={{
      padding: '0 12px 12px 32px',
      background: '#f8fafc',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        fontSize: 11,
        fontFamily: 'ui-monospace, monospace',
      }}>
        <div>
          <div style={{
            fontSize: 10,
            fontWeight: 500,
            color: '#991b1b',
            marginBottom: 4
          }}>
            Before:
          </div>
          <pre style={{
            margin: 0,
            padding: 8,
            background: '#fff5f5',
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 80,
            whiteSpace: 'pre-wrap',
            color: '#991b1b',
          }}>
            {originalCode}
          </pre>
        </div>
        <div>
          <div style={{
            fontSize: 10,
            fontWeight: 500,
            color: '#166534',
            marginBottom: 4
          }}>
            After (JSX):
          </div>
          <pre style={{
            margin: 0,
            padding: 8,
            background: '#f0fdf4',
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 80,
            whiteSpace: 'pre-wrap',
            color: '#166534',
          }}>
            {fixedJsx}
          </pre>
        </div>
      </div>
    </div>
  );
}
