import type { PRFormFieldsProps } from './types';

export function PRFormFields({ prTitle, prDescription, onTitleChange, onDescriptionChange }: PRFormFieldsProps) {
  return (
    <>
      <div>
        <label
          htmlFor="pr-title"
          className="text-[13px] font-medium text-slate-600 mb-1.5 block"
        >
          PR Title
        </label>
        <input
          id="pr-title"
          type="text"
          value={prTitle}
          onChange={e => onTitleChange(e.target.value)}
          className="w-full py-2.5 px-3 border border-slate-200 rounded-md text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="pr-description"
          className="text-[13px] font-medium text-slate-600 mb-1.5 block"
        >
          Description (optional)
        </label>
        <textarea
          id="pr-description"
          placeholder="Additional context for reviewers..."
          value={prDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          className="w-full py-2.5 px-3 border border-slate-200 rounded-md text-sm resize-y"
        />
      </div>
    </>
  );
}
