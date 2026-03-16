import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { WidgetConfig, WidgetId } from '../../../types';

interface WidgetTogglePanelProps {
  widgets: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onResize: (id: WidgetId, size: 'half' | 'full') => void;
}

export function WidgetTogglePanel({
  widgets,
  onToggle,
  onReorder,
  onResize,
}: WidgetTogglePanelProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Dashboard Widgets
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        Drag to reorder, toggle visibility, and resize widgets.
      </p>
      <div className="flex flex-col gap-2">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={[
              'flex items-center gap-3 rounded-lg border bg-white px-3 py-2 transition-colors',
              dragIndex === index ? 'opacity-50' : '',
              dropIndex === index && dragIndex !== index
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200',
            ].join(' ')}
          >
            {/* Drag handle */}
            <span className="cursor-grab text-gray-400 hover:text-gray-600">
              <GripVertical size={16} />
            </span>

            {/* Checkbox */}
            <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={widget.enabled}
                onChange={() => onToggle(widget.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm font-medium ${widget.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                {widget.label}
              </span>
            </label>

            {/* Size toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onResize(widget.id, 'half')}
                className={[
                  'px-2 py-0.5 text-xs rounded font-medium transition-colors',
                  widget.size === 'half'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                ].join(' ')}
              >
                Half
              </button>
              <button
                onClick={() => onResize(widget.id, 'full')}
                className={[
                  'px-2 py-0.5 text-xs rounded font-medium transition-colors',
                  widget.size === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                ].join(' ')}
              >
                Full
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
