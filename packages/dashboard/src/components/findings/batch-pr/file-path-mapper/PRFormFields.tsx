import type { PRFormFieldsProps } from './types';

export function PRFormFields({ prTitle, prDescription, onTitleChange, onDescriptionChange }: PRFormFieldsProps) {
  return (
    <>
      <div>
        <label
          htmlFor="pr-title"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#475569',
            marginBottom: 6,
            display: 'block'
          }}
        >
          PR Title
        </label>
        <input
          id="pr-title"
          type="text"
          value={prTitle}
          onChange={e => onTitleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </div>

      <div>
        <label
          htmlFor="pr-description"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#475569',
            marginBottom: 6,
            display: 'block'
          }}
        >
          Description (optional)
        </label>
        <textarea
          id="pr-description"
          placeholder="Additional context for reviewers..."
          value={prDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      </div>
    </>
  );
}
