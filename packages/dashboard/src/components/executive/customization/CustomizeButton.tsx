import { Settings2, Check, X, RotateCcw } from 'lucide-react';

interface CustomizeButtonProps {
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function CustomizeButton({
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onReset,
}: CustomizeButtonProps) {
  if (!isEditing) {
    return (
      <button
        onClick={onStartEdit}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <Settings2 size={16} />
        Customize
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSave}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Check size={16} />
        Done
      </button>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <X size={16} />
        Cancel
      </button>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <RotateCcw size={14} />
        Reset
      </button>
    </div>
  );
}
