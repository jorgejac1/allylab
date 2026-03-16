import { Button, Spinner } from '../../ui';
import { SeverityDot } from './SeverityDot';
import type { FindingWithFix } from '../../../types/batch-pr';
import { Check, X } from 'lucide-react';

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
      <div className="flex justify-between items-center mb-4">
        <p className="text-slate-500 text-sm m-0">
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

      <div className="max-h-[400px] overflow-auto border border-slate-200 rounded-lg">
        {findings.map((item, index) => (
          <FixGenerationRow
            key={item.finding.id}
            item={item}
            onGenerate={() => onGenerateFix(index)}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
        <span className="text-[13px] text-slate-500">
          {fixedCount} of {findings.length} fixes ready
        </span>
        <div className="flex gap-3">
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
    <div className="py-3 px-4 border-b border-slate-200 flex items-center gap-3">
      <div className="flex-1">
        <div className="text-sm font-medium flex items-center gap-2">
          <SeverityDot severity={item.finding.impact} />
          {item.finding.ruleTitle}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
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
      <span className="text-xs text-blue-500 flex items-center gap-1.5">
        <Spinner size={14} /> Generating...
      </span>
    );
  }

  if (item.fix) {
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <Check size={12} /> Fix ready
      </span>
    );
  }

  if (item.error) {
    return (
      <span className="text-xs text-red-600 flex items-center gap-1" title={item.error}>
        <X size={12} /> Failed
      </span>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={onGenerate}>
      Generate
    </Button>
  );
}
