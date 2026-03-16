import { htmlToJsx } from '../../apply-fix/utils';

interface FixPreviewProps {
  originalCode: string;
  fixedCode: string;
}

export function FixPreview({ originalCode, fixedCode }: FixPreviewProps) {
  const fixedJsx = htmlToJsx(fixedCode);

  return (
    <div className="px-3 pb-3 pl-8 bg-slate-50">
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div>
          <div className="text-[10px] font-medium text-red-800 mb-1">
            Before:
          </div>
          <pre className="m-0 p-2 bg-red-50 rounded overflow-auto max-h-[80px] whitespace-pre-wrap text-red-800">
            {originalCode}
          </pre>
        </div>
        <div>
          <div className="text-[10px] font-medium text-green-800 mb-1">
            After (JSX):
          </div>
          <pre className="m-0 p-2 bg-green-50 rounded overflow-auto max-h-[80px] whitespace-pre-wrap text-green-800">
            {fixedJsx}
          </pre>
        </div>
      </div>
    </div>
  );
}
