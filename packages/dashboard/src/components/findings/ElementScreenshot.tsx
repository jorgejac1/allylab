import { useState } from 'react';
import { Image, Camera } from 'lucide-react';

interface ElementScreenshotProps {
  screenshot?: string; // base64 encoded PNG
  selector: string;
}

export function ElementScreenshot({ screenshot, selector }: ElementScreenshotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!screenshot || imageError) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 text-[13px]">
        <div className="mb-2 flex justify-center"><Image size={24} /></div>
        <p className="m-0">Screenshot not available</p>
        <p className="mt-1 mb-0 text-xs">
          Run a new scan to capture element screenshots
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="py-2 px-3 bg-white border-b border-slate-200 flex justify-between items-center">
        <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5">
          <Camera size={14} /> Element Screenshot
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-none border-none text-blue-500 text-xs cursor-pointer"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Image Container */}
      <div
        className="p-3 flex justify-center items-center min-h-20 overflow-hidden relative"
        style={{
          background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 16px 16px',
          maxHeight: isExpanded ? 'none' : 200,
        }}
      >
        <img
          src={`data:image/png;base64,${screenshot}`}
          alt="Element with accessibility issue highlighted"
          onError={() => setImageError(true)}
          className="max-w-full object-contain rounded shadow-md"
          style={{ maxHeight: isExpanded ? 'none' : 180 }}
          loading="lazy"
        />

        {/* Issue indicator badge */}
        <div className="absolute top-2 right-2 py-1 px-2 bg-red-500/90 text-white rounded text-[10px] font-semibold">
          Issue Location
        </div>
      </div>

      {/* Caption */}
      <div className="py-2 px-3 bg-white border-t border-slate-200 text-xs text-slate-500">
        <span className="font-medium">Element:</span>{' '}
        <code className="bg-slate-100 px-1 py-px rounded-sm text-[10px]">
          {selector.length > 60 ? selector.slice(0, 60) + '...' : selector}
        </code>
      </div>
    </div>
  );
}
