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
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
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

      <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
        <input
          type="text"
          placeholder="Custom search..."
          value={customQuery}
          onChange={e => onCustomQueryChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && customQuery && onSearch(customQuery, 'custom')}
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1px solid #e2e8f0',
            borderRadius: 4,
            fontSize: 13,
          }}
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

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
      }}>
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: 12,
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          Skip - I'll find it myself
        </button>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>
          Press <kbd style={{
            background: '#f1f5f9',
            padding: '1px 4px',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
          }}>Esc</kbd> to cancel
        </span>
      </div>
    </div>
  );
}
