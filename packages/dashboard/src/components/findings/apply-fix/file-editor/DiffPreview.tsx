interface DiffPreviewProps {
  originalCode: string;
  fixedCode: string;
}

export function DiffPreview({ originalCode, fixedCode }: DiffPreviewProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <DiffHeader />
      <DiffContent originalCode={originalCode} fixedCode={fixedCode} />
    </div>
  );
}

function DiffHeader() {
  return (
    <div className="grid grid-cols-2 text-[11px] font-semibold">
      <div className="py-1.5 px-3 bg-red-50 text-red-800 border-r border-slate-200">
        ⊖ Current Code
      </div>
      <div className="py-1.5 px-3 bg-green-50 text-green-800">
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
  return (
    <div className="grid grid-cols-2">
      <pre className="m-0 p-2.5 overflow-auto max-h-[120px] whitespace-pre-wrap font-mono text-[11px] leading-normal bg-red-50 border-r border-slate-200 text-red-800">
        {originalCode}
      </pre>
      <pre className="m-0 p-2.5 overflow-auto max-h-[120px] whitespace-pre-wrap font-mono text-[11px] leading-normal bg-green-50 text-green-800">
        {fixedCode}
      </pre>
    </div>
  );
}
