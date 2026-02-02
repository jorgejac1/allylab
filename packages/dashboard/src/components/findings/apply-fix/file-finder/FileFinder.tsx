import { useState, useCallback, useEffect } from 'react';
import { calculateMatchConfidence, extractAllClasses } from '../utils';
import { SearchOptions } from './SearchOptions';
import { SearchResults } from './SearchResults';
import { getLastSearchType, saveSearchType } from './searchTypeStorage';
import type { FileFinderProps, RankedFile, Mode, SearchType } from './types';

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
