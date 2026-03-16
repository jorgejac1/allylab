interface CodePreviewProps {
  original: string;
  fixed: string;
}

export function CodePreview({ original, fixed }: CodePreviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Original Code */}
      <div>
        <div className="text-[11px] font-semibold text-red-600 uppercase mb-1.5 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          Find This
        </div>
        <pre className="m-0 p-3 bg-red-50 border border-red-200 rounded-md text-xs font-mono overflow-auto max-h-[150px] whitespace-pre-wrap break-words text-red-800">
          {original}
        </pre>
      </div>

      {/* Fixed Code */}
      <div>
        <div className="text-[11px] font-semibold text-green-600 uppercase mb-1.5 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-600" />
          Replace With
        </div>
        <pre className="m-0 p-3 bg-green-50 border border-green-200 rounded-md text-xs font-mono overflow-auto max-h-[150px] whitespace-pre-wrap break-words text-green-800">
          {fixed}
        </pre>
      </div>
    </div>
  );
}
