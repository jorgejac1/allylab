import { Button } from '../../../ui';
import { FileText, Tag, Search, FolderOpen } from 'lucide-react';
import { OptionButton } from './OptionButton';
import type { SearchType } from './types';

interface SearchOptionsProps {
  textContent: string | null;
  classNames: string[];
  htmlClasses: string[];
  customQuery: string;
  lastSearchType: string | null;
  onCustomQueryChange: (value: string) => void;
  onSearch: (query: string, searchType: SearchType) => void;
  onBrowse: () => void;
  onSkip: () => void;
}

export function SearchOptions({
  textContent,
  classNames,
  htmlClasses,
  customQuery,
  lastSearchType,
  onCustomQueryChange,
  onSearch,
  onBrowse,
  onSkip,
}: SearchOptionsProps) {
  // Get significant classes for search
  const significantClasses = htmlClasses
    .filter(c => c.length > 5 && !c.match(/^(sm:|md:|lg:|xl:|hover:|focus:)/))
    .slice(0, 3);

  // Determine recommended option
  const getRecommendation = (type: SearchType): 'recommended' | 'last-worked' | null => {
    if (lastSearchType === type) return 'last-worked';
    if (type === 'text' && textContent && !lastSearchType) return 'recommended';
    if (type === 'class' && !textContent && significantClasses.length > 0 && !lastSearchType) return 'recommended';
    return null;
  };

  return (
    <div className="border border-slate-200 rounded-md p-3 flex flex-col gap-2">
      {textContent && (
        <OptionButton
          icon={<FileText size={16} />}
          title="Search by text"
          subtitle={`"${textContent.slice(0, 30)}${textContent.length > 30 ? '...' : ''}"`}
          badge={getRecommendation('text')}
          onClick={() => onSearch(`"${textContent}"`, 'text')}
        />
      )}

      {significantClasses.length > 0 && (
        <OptionButton
          icon={<Tag size={16} />}
          title="Search by class"
          subtitle={significantClasses.map(c => `.${c}`).join(', ')}
          badge={getRecommendation('class')}
          onClick={() => onSearch(significantClasses[0], 'class')}
        />
      )}

      {classNames.length > 0 && classNames[0] !== significantClasses[0] && (
        <OptionButton
          icon={<Search size={16} />}
          title="Search by selector class"
          subtitle={`.${classNames.slice(0, 2).join(', .')}`}
          badge={getRecommendation('selector')}
          onClick={() => onSearch(classNames[0], 'selector')}
        />
      )}

      <div className="flex gap-2 py-2">
        <input
          type="text"
          placeholder="Custom search..."
          value={customQuery}
          onChange={e => onCustomQueryChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && customQuery && onSearch(customQuery, 'custom')}
          className="flex-1 py-2 px-2.5 border border-slate-200 rounded text-[13px]"
        />
        <Button
          variant="secondary"
          onClick={() => customQuery && onSearch(customQuery, 'custom')}
          disabled={!customQuery}
        >
          Search
        </Button>
      </div>

      <OptionButton
        icon={<FolderOpen size={16} />}
        title="Browse all files"
        subtitle="View all component files in repo"
        badge={getRecommendation('browse')}
        onClick={onBrowse}
      />

      <div className="flex justify-between items-center pt-1">
        <button
          onClick={onSkip}
          className="bg-none border-none text-slate-500 text-xs cursor-pointer py-2"
        >
          Skip - I'll find it myself
        </button>
        <span className="text-[10px] text-slate-400">
          Press <kbd className="bg-slate-100 px-1 py-px rounded-sm border border-slate-200">Esc</kbd> to cancel
        </span>
      </div>
    </div>
  );
}
