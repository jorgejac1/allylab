import { Button, Spinner } from '../../ui';
import { SeverityDot } from './SeverityDot';
import type { FindingWithFix } from '../../../types/batch-pr';

interface FixGenerationListProps {
  findings: FindingWithFix[];
  onGenerateFix: (index: number) => void;
  onGenerateAll: () => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function FixGenerationList({
  findings,
  onGenerateFix,
  onGenerateAll,
  onContinue,
  onCancel,
}: FixGenerationListProps) {
  const fixedCount = findings.filter(f => f.fix).length;
  const generatingCount = findings.filter(f => f.isGenerating).length;
  const allFixed = fixedCount === findings.length;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
          Generate AI fixes for selected issues:
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerateAll}
          disabled={generatingCount > 0 || allFixed}
        >
          {generatingCount > 0 ? `Generating (${generatingCount})...` : 'Generate All Fixes'}
        </Button>
      </div>

      <div style={{ 
        maxHeight: 400, 
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}>
        {findings.map((item, index) => (
          <FixGenerationRow
            key={item.finding.id}
            item={item}
            onGenerate={() => onGenerateFix(index)}
          />
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid #e2e8f0',
      }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {fixedCount} of {findings.length} fixes ready
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onContinue}
            disabled={fixedCount === 0}
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FixGenerationRowProps {
  item: FindingWithFix;
  onGenerate: () => void;
}

function FixGenerationRow({ item, onGenerate }: FixGenerationRowProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <SeverityDot severity={item.finding.impact} />
          {item.finding.ruleTitle}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {item.finding.selector.slice(0, 50)}
          {item.finding.selector.length > 50 ? '...' : ''}
        </div>
      </div>

      <FixStatus item={item} onGenerate={onGenerate} />
    </div>
  );
}

interface FixStatusProps {
  item: FindingWithFix;
  onGenerate: () => void;
}

function FixStatus({ item, onGenerate }: FixStatusProps) {
  if (item.isGenerating) {
    return (
      <span style={{ fontSize: 12, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Spinner size={14} /> Generating...
      </span>
    );
  }

  if (item.fix) {
    return (
      <span style={{ fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
        ✓ Fix ready
      </span>
    );
  }

  if (item.error) {
    return (
      <span style={{ fontSize: 12, color: '#dc2626' }} title={item.error}>
        ✗ Failed
      </span>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={onGenerate}>
      Generate
    </Button>
  );
}