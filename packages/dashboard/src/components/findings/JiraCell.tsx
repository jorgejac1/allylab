import { Check, X, Link } from 'lucide-react';

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
  if (isLinking) {
    return (
      <div className="flex gap-1 items-center">
        <input
          type="text"
          value={linkInput}
          onChange={e => onLinkInputChange(e.target.value)}
          placeholder="PROJ-123"
          autoFocus
          className="w-20 py-1 px-2 text-xs border border-blue-500 rounded outline-none shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
          onKeyDown={e => {
            if (e.key === 'Enter') onSaveLink();
            if (e.key === 'Escape') onCancelLink();
          }}
        />
        <button
          onClick={onSaveLink}
          aria-label="Save JIRA link"
          className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded py-1 px-1.5 text-[10px] cursor-pointer transition-colors duration-150"
        >
          <Check size={10} aria-hidden="true" />
        </button>
        <button
          onClick={onCancelLink}
          aria-label="Cancel"
          className="bg-slate-100 hover:bg-slate-200 text-slate-500 border-none rounded py-1 px-1.5 text-[10px] cursor-pointer transition-colors duration-150 inline-flex items-center"
        >
          <X size={10} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (issueKey) {
    return (
      <div className="flex gap-1 items-center">
        <a
          href="#"
          onClick={e => e.preventDefault()}
          className="inline-flex items-center gap-1 py-0.5 px-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-semibold no-underline transition-all duration-150 border border-transparent hover:border-blue-300"
          title={`View ${issueKey} in JIRA`}
        >
          <Link size={12} /> {issueKey}
        </a>
        <button
          onClick={onRemoveLink}
          aria-label="Remove JIRA link"
          className="bg-none hover:bg-red-50 border-none text-slate-400 hover:text-red-500 cursor-pointer text-xs p-0.5 rounded transition-all duration-150"
          title="Remove link"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartLink}
      className="bg-slate-50 hover:bg-slate-100 border border-dashed border-gray-300 hover:border-slate-400 rounded py-1 px-2.5 text-xs text-slate-500 hover:text-slate-600 cursor-pointer transition-all duration-150 inline-flex items-center gap-1"
    >
      <span className="text-[10px]">+</span> Link
    </button>
  );
}
