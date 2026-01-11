import { useState } from 'react';

interface ElementScreenshotProps {
  screenshot?: string; // base64 encoded PNG
  selector: string;
}

export function ElementScreenshot({ screenshot, selector }: ElementScreenshotProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!screenshot || imageError) {
    return (
      <div style={{
        padding: 16,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 13,
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🖼️</div>
        <p style={{ margin: 0 }}>Screenshot not available</p>
        <p style={{ margin: '4px 0 0', fontSize: 11 }}>
          Run a new scan to capture element screenshots
        </p>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#f8fafc',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>
          📸 Element Screenshot
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Image Container */}
      <div style={{
        padding: 12,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50% / 16px 16px',
        minHeight: 80,
        maxHeight: isExpanded ? 'none' : 200,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <img
          src={`data:image/png;base64,${screenshot}`}
          alt="Element with accessibility issue highlighted"
          onError={() => setImageError(true)}
          style={{
            maxWidth: '100%',
            maxHeight: isExpanded ? 'none' : 180,
            objectFit: 'contain',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        
        {/* Issue indicator badge */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          padding: '4px 8px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: '#fff',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
        }}>
          Issue Location
        </div>
      </div>

      {/* Caption */}
      <div style={{
        padding: '8px 12px',
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        fontSize: 11,
        color: '#64748b',
      }}>
        <span style={{ fontWeight: 500 }}>Element:</span>{' '}
        <code style={{ 
          background: '#f1f5f9', 
          padding: '1px 4px', 
          borderRadius: 3,
          fontSize: 10,
        }}>
          {selector.length > 60 ? selector.slice(0, 60) + '...' : selector}
        </code>
      </div>
    </div>
  );
}