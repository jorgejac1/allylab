import { Search } from 'lucide-react';
import { FileResultItem } from './FileResultItem';
import type { RankedFile } from './types';

interface SearchResultsProps {
  mode: 'search' | 'browse';
  results: RankedFile[];
  isLoading: boolean;
  isRanking: boolean;
  error: string | null;
  filter: string;
  onFilterChange: (value: string) => void;
  onBack: () => void;
  onSelect: (path: string) => void;
}

export function SearchResults({
  mode,
  results,
  isLoading,
  isRanking,
  error,
  filter,
  onFilterChange,
  onBack,
  onSelect,
}: SearchResultsProps) {
  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <ResultsHeader
        isLoading={isLoading}
        isRanking={isRanking}
        resultCount={results.length}
        onBack={onBack}
      />

      {mode === 'browse' && results.length > 0 && (
        <FilterInput value={filter} onChange={onFilterChange} />
      )}

      <ResultsContent
        results={results}
        isLoading={isLoading}
        isRanking={isRanking}
        error={error}
        onSelect={onSelect}
      />
    </div>
  );
}

function ResultsHeader({
  isLoading,
  isRanking,
  resultCount,
  onBack,
}: {
  isLoading: boolean;
  isRanking: boolean;
  resultCount: number;
  onBack: () => void;
}) {
  const statusText = isLoading
    ? 'Searching...'
    : isRanking
    ? 'Ranking results...'
    : `${resultCount} files`;

  return (
    <div style={{
      padding: '8px 12px',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>
        {statusText}
      </span>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#3b82f6',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
    </div>
  );
}

function FilterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
      <input
        type="text"
        placeholder="Filter files..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 10px',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          fontSize: 12,
        }}
      />
    </div>
  );
}

function ResultsContent({
  results,
  isLoading,
  isRanking,
  error,
  onSelect,
}: {
  results: RankedFile[];
  isLoading: boolean;
  isRanking: boolean;
  error: string | null;
  onSelect: (path: string) => void;
}) {
  if (isLoading) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <Search size={20} aria-hidden="true" />
        </div>
        Searching repository...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: '#dc2626', fontSize: 13 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxHeight: 300, overflow: 'auto' }}>
      {results.slice(0, 50).map((file, idx) => (
        <FileResultItem
          key={idx}
          file={file}
          isRanking={isRanking}
          onSelect={() => onSelect(file.path)}
        />
      ))}
    </div>
  );
}
