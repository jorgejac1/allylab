import { useState, useCallback, useEffect } from 'react';
import { Button } from '../../ui';
import type { RankedFile, MatchConfidence } from './utils';
import { calculateMatchConfidence, extractAllClasses } from './utils';

// Remember last successful search type per domain
const SEARCH_TYPE_KEY = 'allylab-search-type';

function getLastSearchType(domain: string): string | null {
  try {
    const saved = localStorage.getItem(SEARCH_TYPE_KEY);
    if (saved) {
      const mapping = JSON.parse(saved);
      return mapping[domain] || null;
    }
  } catch {
    return null;
  }
  return null;
}

function saveSearchType(domain: string, type: string): void {
  try {
    const saved = localStorage.getItem(SEARCH_TYPE_KEY);
    const mapping = saved ? JSON.parse(saved) : {};
    mapping[domain] = type;
    localStorage.setItem(SEARCH_TYPE_KEY, JSON.stringify(mapping));
  } catch {
    // Ignore storage errors
  }
}

interface FileFinderProps {
  repoOwner: string;
  repoName: string;
  branch: string;
  textContent: string | null;
  classNames: string[];
  originalHtml: string;
  scanUrl?: string;
  searchCode: (owner: string, repo: string, query: string) => Promise<CodeSearchResult[]>;
  getRepoTree: (owner: string, repo: string, branch?: string) => Promise<RepoFile[]>;
  getFileContent?: (owner: string, repo: string, path: string, branch: string) => Promise<string | null>;
  onSelect: (path: string) => void;
  onSkip: () => void;
  onAutoSelect?: (path: string) => void; // Called when auto-selecting best match
}

interface CodeSearchResult {
  path: string;
  matchedLines: Array<{ content: string }>;
}

interface RepoFile {
  path: string;
}

type Mode = 'options' | 'search' | 'browse';
type SearchType = 'text' | 'class' | 'selector' | 'custom' | 'browse';

export function FileFinder({
  repoOwner,
  repoName,
  branch,
  textContent,
  classNames,
  originalHtml,
  scanUrl,
  searchCode,
  getRepoTree,
  getFileContent,
  onSelect,
  onSkip,
  onAutoSelect,
}: FileFinderProps) {
  const [mode, setMode] = useState<Mode>('options');
  const [results, setResults] = useState<RankedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [lastSearchType, setLastSearchType] = useState<SearchType | null>(null);

  // Get domain for remembering search type
  const domain = scanUrl ? new URL(scanUrl).hostname : repoName;

  // Load last successful search type
  useEffect(() => {
    const saved = getLastSearchType(domain);
    if (saved) {
      setLastSearchType(saved as SearchType);
    }
  }, [domain]);

  // Extract classes from original HTML for matching
  const htmlClasses = extractAllClasses(originalHtml);

  const handleSearch = useCallback(async (query: string, searchType: SearchType = 'custom') => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setMode('search');
    
    try {
      const searchResults = await searchCode(repoOwner, repoName, query.trim());
      const filtered = searchResults
        .filter(r => 
          r.path.match(/\.(tsx?|jsx?|vue|svelte)$/) &&
          !r.path.includes('node_modules')
        );
      
      if (filtered.length === 0) {
        setResults([]);
        setError('No files found. Try browsing all files instead.');
        setIsLoading(false);
        return;
      }

      // Initial results without ranking
      const initialResults: RankedFile[] = filtered.map(r => ({
        path: r.path,
        preview: r.matchedLines[0]?.content,
        confidence: {
          score: 0,
          level: 'none' as const,
          matchedClasses: [],
          matchedText: null,
          details: 'Calculating...',
        },
        isBestMatch: false,
      }));
      
      setResults(initialResults);
      setIsLoading(false);
      
      // If we have getFileContent, fetch and rank files
      if (getFileContent && filtered.length <= 10) {
        setIsRanking(true);
        
        const rankedResults: RankedFile[] = await Promise.all(
          filtered.map(async (file) => {
            try {
              const content = await getFileContent(repoOwner, repoName, file.path, branch);
              const confidence = calculateMatchConfidence(
                content || file.matchedLines[0]?.content || '',
                originalHtml,
                textContent
              );
              
              // Get better preview (3 context lines around match)
              let preview = file.matchedLines[0]?.content;
              if (content && textContent) {
                const lines = content.split('\n');
                const matchLine = lines.findIndex(l => l.includes(textContent));
                if (matchLine !== -1) {
                  const start = Math.max(0, matchLine - 1);
                  const end = Math.min(lines.length, matchLine + 2);
                  preview = lines.slice(start, end).join('\n');
                }
              }
              
              return {
                path: file.path,
                preview,
                confidence,
                isBestMatch: false,
              };
            } catch {
              return {
                path: file.path,
                preview: file.matchedLines[0]?.content,
                confidence: {
                  score: 0,
                  level: 'none' as const,
                  matchedClasses: [],
                  matchedText: null,
                  details: 'Could not analyze',
                },
                isBestMatch: false,
              };
            }
          })
        );
        
        // Sort by confidence
        rankedResults.sort((a, b) => b.confidence.score - a.confidence.score);
        
        // Mark best match
        if (rankedResults.length > 0 && rankedResults[0].confidence.level !== 'none') {
          rankedResults[0].isBestMatch = true;
        }
        
        setResults(rankedResults);
        setIsRanking(false);
        
        // AUTO-SELECT: If only 1 result with high confidence, auto-select it
        const highConfidenceResults = rankedResults.filter(r => r.confidence.level === 'high');
        if (highConfidenceResults.length === 1 && rankedResults.length <= 3) {
          // Save successful search type
          saveSearchType(domain, searchType);
          
          // Auto-select after a brief delay so user sees what happened
          setTimeout(() => {
            if (onAutoSelect) {
              onAutoSelect(highConfidenceResults[0].path);
            } else {
              onSelect(highConfidenceResults[0].path);
            }
          }, 500);
        } else if (rankedResults.length > 0 && rankedResults[0].isBestMatch) {
          // Save search type even if not auto-selecting
          saveSearchType(domain, searchType);
        }
      } else {
        // Simple ranking based on preview content
        const simpleRanked: RankedFile[] = filtered.map(r => {
          const confidence = calculateMatchConfidence(
            r.matchedLines[0]?.content || '',
            originalHtml,
            textContent
          );
          return {
            path: r.path,
            preview: r.matchedLines[0]?.content,
            confidence,
            isBestMatch: false,
          };
        });
        
        simpleRanked.sort((a, b) => b.confidence.score - a.confidence.score);
        if (simpleRanked.length > 0 && simpleRanked[0].confidence.level !== 'none') {
          simpleRanked[0].isBestMatch = true;
        }
        
        setResults(simpleRanked);
      }
    } catch (err) {
      console.error('[FileFinder] Search failed:', err);
      setError('Search failed. The repo may still be indexing. Try browsing instead.');
      setIsLoading(false);
    }
  }, [repoOwner, repoName, searchCode, originalHtml, textContent, getFileContent, branch, domain, onSelect, onAutoSelect]);

  const handleBrowse = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMode('browse');
    
    try {
      const files = await getRepoTree(repoOwner, repoName, branch);
      const ranked: RankedFile[] = files.map(f => ({
        path: f.path,
        confidence: {
          score: 0,
          level: 'none' as const,
          matchedClasses: [],
          matchedText: null,
          details: '',
        },
        isBestMatch: false,
      }));
      setResults(ranked);
      if (files.length === 0) {
        setError('No component files found.');
      }
    } catch (err) {
      console.error('[FileFinder] Browse failed:', err);
      setError('Failed to load files.');
    } finally {
      setIsLoading(false);
    }
  }, [repoOwner, repoName, branch, getRepoTree]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode !== 'options') {
          setMode('options');
        } else {
          onSkip();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onSkip]);

  const filteredResults = filter
    ? results.filter(r => r.path.toLowerCase().includes(filter.toLowerCase()))
    : results;

  if (mode === 'options') {
    return (
      <SearchOptions
        textContent={textContent}
        classNames={classNames}
        htmlClasses={htmlClasses}
        customQuery={customQuery}
        lastSearchType={lastSearchType}
        onCustomQueryChange={setCustomQuery}
        onSearch={handleSearch}
        onBrowse={handleBrowse}
        onSkip={onSkip}
      />
    );
  }

  return (
    <SearchResults
      mode={mode}
      results={filteredResults}
      isLoading={isLoading}
      isRanking={isRanking}
      error={error}
      filter={filter}
      onFilterChange={setFilter}
      onBack={() => setMode('options')}
      onSelect={onSelect}
    />
  );
}

// Sub-components

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

function SearchOptions({
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
          icon="📝"
          title="Search by text"
          subtitle={`"${textContent.slice(0, 30)}${textContent.length > 30 ? '...' : ''}"`}
          badge={getRecommendation('text')}
          onClick={() => onSearch(`"${textContent}"`, 'text')}
        />
      )}
      
      {significantClasses.length > 0 && (
        <OptionButton
          icon="🏷️"
          title="Search by class"
          subtitle={significantClasses.map(c => `.${c}`).join(', ')}
          badge={getRecommendation('class')}
          onClick={() => onSearch(significantClasses[0], 'class')}
        />
      )}
      
      {classNames.length > 0 && classNames[0] !== significantClasses[0] && (
        <OptionButton
          icon="🔍"
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
        icon="📂"
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

function OptionButton({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge?: 'recommended' | 'last-worked' | null;
  onClick: () => void;
}) {
  const isHighlighted = badge === 'recommended' || badge === 'last-worked';
  
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: isHighlighted ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: 6,
        background: isHighlighted ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.background = isHighlighted ? '#dbeafe' : '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = isHighlighted ? '#eff6ff' : '#fff'}
    >
      <span>{icon}</span>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
          {subtitle}
        </div>
      </div>
      {badge === 'recommended' && (
        <span style={{
          fontSize: 10,
          background: '#3b82f6',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          Recommended
        </span>
      )}
      {badge === 'last-worked' && (
        <span style={{
          fontSize: 10,
          background: '#22c55e',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 600,
        }}>
          ✓ Last worked
        </span>
      )}
    </button>
  );
}

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

function SearchResults({
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
      <div style={{
        padding: '8px 12px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {isLoading ? 'Searching...' : isRanking ? 'Ranking results...' : `${results.length} files`}
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
      
      {mode === 'browse' && results.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Filter files..."
            value={filter}
            onChange={e => onFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              fontSize: 12,
            }}
          />
        </div>
      )}
      
      {isLoading ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
          <div style={{ marginBottom: 8 }}>🔍</div>
          Searching repository...
        </div>
      ) : error ? (
        <div style={{ padding: 16, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      ) : (
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
      )}
    </div>
  );
}

function FileResultItem({
  file,
  isRanking,
  onSelect,
}: {
  file: RankedFile;
  isRanking: boolean;
  onSelect: () => void;
}) {
  const confidenceColors: Record<MatchConfidence['level'], { bg: string; text: string; border: string }> = {
    high: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    medium: { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
    low: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    none: { bg: '#fff', text: '#64748b', border: '#e2e8f0' },
  };
  
  const colors = confidenceColors[file.confidence.level];
  
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        borderBottom: '1px solid #f1f5f9',
        borderLeft: file.isBestMatch ? '4px solid #22c55e' : '4px solid transparent',
        background: file.isBestMatch ? '#f0fdf4' : '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.background = file.isBestMatch ? '#dcfce7' : '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = file.isBestMatch ? '#f0fdf4' : '#fff'}
    >
      {/* File path + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#0f172a', flex: 1 }}>
          📄 {file.path}
        </span>
        {file.isBestMatch && (
          <span style={{
            fontSize: 10,
            background: '#22c55e',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 600,
          }}>
            🎯 Best Match
          </span>
        )}
        {!file.isBestMatch && file.confidence.level !== 'none' && (
          <span style={{
            fontSize: 10,
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: '2px 6px',
            borderRadius: 4,
            fontWeight: 500,
          }}>
            {file.confidence.level === 'high' ? '✓ High' : 
             file.confidence.level === 'medium' ? '~ Medium' : '? Low'}
          </span>
        )}
      </div>
      
      {/* Confidence details */}
      {file.confidence.level !== 'none' && !isRanking && (
        <div style={{ fontSize: 10, color: '#64748b' }}>
          {file.confidence.details}
        </div>
      )}
      
      {/* Preview */}
      {file.preview && (
        <pre style={{
          margin: 0,
          padding: 8,
          background: '#f8fafc',
          borderRadius: 4,
          fontSize: 10,
          color: '#475569',
          fontFamily: 'ui-monospace, monospace',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          maxHeight: 60,
          lineHeight: 1.4,
        }}>
          {file.preview.length > 150 ? file.preview.slice(0, 150) + '...' : file.preview}
        </pre>
      )}
    </button>
  );
}