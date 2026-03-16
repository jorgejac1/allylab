import { Edit3 } from 'lucide-react';

interface EditorHeaderProps {
  filePath: string;
  onBack: () => void;
}

export function EditorHeader({ filePath, onBack }: EditorHeaderProps) {
  const fileName = filePath.split('/').pop();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="m-0 text-sm font-semibold inline-flex items-center gap-1.5">
          <Edit3 size={14} aria-hidden="true" /> Edit: {fileName}
        </h3>
        <p className="mt-1 mb-0 text-xs text-slate-500">
          {filePath}
        </p>
      </div>
      <button
        onClick={onBack}
        className="bg-none border-none text-blue-500 text-[13px] cursor-pointer"
      >
        ← Back
      </button>
    </div>
  );
}
