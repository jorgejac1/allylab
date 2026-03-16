import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color?: string) => void;
}

const PRESET_COLORS = [
  { name: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-300' },
  { name: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
  { name: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-300' },
  { name: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-300' },
  { name: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-300' },
  { name: 'slate', bg: 'bg-slate-500', ring: 'ring-slate-300' },
];

export function SavePresetModal({ isOpen, onClose, onSave }: SavePresetModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, selectedColor);
    setName('');
    setSelectedColor('blue');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setSelectedColor('blue');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Save Filter Preset"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            Save Preset
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="preset-name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Preset Name
          </label>
          <Input
            id="preset-name"
            type="text"
            placeholder="e.g., My Custom Filter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Color
          </label>
          <div className="flex gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelectedColor(color.name)}
                aria-label={`Select ${color.name} color`}
                className={`w-8 h-8 rounded-full cursor-pointer border-none transition-all ${color.bg} ${
                  selectedColor === color.name
                    ? `ring-2 ${color.ring} ring-offset-2`
                    : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
