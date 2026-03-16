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
    <div className="border border-slate-200 rounded-md overflow-hidden">
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
    <div className="py-2 px-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
      <span className="text-xs text-slate-500">
        {statusText}
      </span>
      <button
        onClick={onBack}
        className="bg-none border-none text-blue-500 text-xs cursor-pointer"
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
    <div className="py-2 px-3 border-b border-slate-200">
      <input
        type="text"
        placeholder="Filter files..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full py-1.5 px-2.5 border border-slate-200 rounded text-xs"
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
      <div className="p-4 text-center text-slate-500">
        <div className="mb-2 flex justify-center">
          <Search size={20} aria-hidden="true" />
        </div>
        Searching repository...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-[13px]">
        {error}
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-auto">
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
