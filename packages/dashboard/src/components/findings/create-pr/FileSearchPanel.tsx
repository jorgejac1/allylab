import type { ReactNode } from 'react';
import { Button } from '../../ui';
import type { CodeSearchResult, RepoFile } from './useCreatePRForm';
import { FolderOpen, FileText, Tag, Search, X } from 'lucide-react';

interface FileSearchPanelProps {
  repoName: string;
  searchMode: 'options' | 'results' | 'browse';
  searchResults: CodeSearchResult[];
  repoFiles: RepoFile[];
  isSearching: boolean;
  searchError: string | null;
  customSearch: string;
  fileFilter: string;
  textContent: string | null;
  classNames: string[];
  onSearch: (query: string) => void;
  onBrowse: () => void;
  onSelectFile: (path: string) => void;
  onClose: () => void;
  onBackToOptions: () => void;
  onCustomSearchChange: (value: string) => void;
  onFileFilterChange: (value: string) => void;
}

export function FileSearchPanel({
  repoName,
  searchMode,
  searchResults,
  repoFiles,
  isSearching,
  searchError,
  customSearch,
  fileFilter,
  textContent,
  classNames,
  onSearch,
  onBrowse,
  onSelectFile,
  onClose,
  onBackToOptions,
  onCustomSearchChange,
  onFileFilterChange,
}: FileSearchPanelProps) {
  return (
    <div style={{
      marginTop: 8,
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FolderOpen size={14} /> Find file in {repoName}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {searchMode === 'options' && (
        <SearchOptions
          textContent={textContent}
          classNames={classNames}
          customSearch={customSearch}
          onSearch={onSearch}
          onBrowse={onBrowse}
          onCustomSearchChange={onCustomSearchChange}
        />
      )}

      {searchMode === 'results' && (
        <SearchResults
          results={searchResults}
          isSearching={isSearching}
          error={searchError}
          onSelect={onSelectFile}
          onBack={onBackToOptions}
        />
      )}

      {searchMode === 'browse' && (
        <BrowseFiles
          files={repoFiles}
          isSearching={isSearching}
          error={searchError}
          filter={fileFilter}
          onSelect={onSelectFile}
          onBack={onBackToOptions}
          onFilterChange={onFileFilterChange}
        />
      )}
    </div>
  );
}

// Search Options Panel
interface SearchOptionsProps {
  textContent: string | null;
  classNames: string[];
  customSearch: string;
  onSearch: (query: string) => void;
  onBrowse: () => void;
  onCustomSearchChange: (value: string) => void;
}

function SearchOptions({
  textContent,
  classNames,
  customSearch,
  onSearch,
  onBrowse,
  onCustomSearchChange,
}: SearchOptionsProps) {
  return (
    <div style={{ padding: 12 }}>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
        Choose how to find the file:
      </p>

      {/* Search by text content */}
      {textContent && (
        <SearchOptionButton
          icon={<FileText size={16} />}
          title="Search by text content"
          subtitle={`"${textContent.slice(0, 40)}${textContent.length > 40 ? '...' : ''}"`}
          onClick={() => onSearch(`"${textContent}"`)}
        />
      )}

      {/* Search by class names */}
      {classNames.length > 0 && (
        <SearchOptionButton
          icon={<Tag size={16} />}
          title="Search by class name"
          subtitle={`.${classNames.join(', .')}`}
          onClick={() => onSearch(classNames[0])}
        />
      )}

      {/* Custom search */}
      <div style={{
        padding: '10px 12px',
        marginBottom: 8,
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Search size={16} />
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
            Custom search
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Enter search term..."
            value={customSearch}
            onChange={e => onCustomSearchChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && customSearch && onSearch(customSearch)}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              fontSize: 12,
            }}
          />
          <Button
            variant="secondary"
            onClick={() => customSearch && onSearch(customSearch)}
            disabled={!customSearch}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Browse all files */}
      <SearchOptionButton
        icon={<FolderOpen size={16} />}
        title="Browse all files"
        subtitle="View component files in the repository"
        onClick={onBrowse}
      />
    </div>
  );
}

// Reusable search option button
interface SearchOptionButtonProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function SearchOptionButton({ icon, title, subtitle, onClick }: SearchOptionButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 12px',
        marginBottom: 8,
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        background: '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
          {subtitle}
        </div>
      </div>
    </button>
  );
}

// Search Results Panel
interface SearchResultsProps {
  results: CodeSearchResult[];
  isSearching: boolean;
  error: string | null;
  onSelect: (path: string) => void;
  onBack: () => void;
}

function SearchResults({ results, isSearching, error, onSelect, onBack }: SearchResultsProps) {
  return (
    <div>
      <ResultsHeader
        label={isSearching ? 'Searching...' : `${results.length} files found`}
        onBack={onBack}
      />

      {isSearching ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
          Searching repository...
        </div>
      ) : error ? (
        <div style={{ padding: 16, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {results.map((result, idx) => (
            <FileResultItem
              key={idx}
              path={result.path}
              preview={result.matchedLines[0]?.content}
              isLast={idx === results.length - 1}
              onSelect={() => onSelect(result.path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Browse Files Panel
interface BrowseFilesProps {
  files: RepoFile[];
  isSearching: boolean;
  error: string | null;
  filter: string;
  onSelect: (path: string) => void;
  onBack: () => void;
  onFilterChange: (value: string) => void;
}

function BrowseFiles({ files, isSearching, error, filter, onSelect, onBack, onFilterChange }: BrowseFilesProps) {
  const filteredFiles = files.filter(f =>
    !filter || f.path.toLowerCase().includes(filter.toLowerCase())
  ).slice(0, 100);

  return (
    <div>
      <ResultsHeader
        label={isSearching ? 'Loading...' : `${files.length} component files`}
        onBack={onBack}
      />

      {/* Filter input */}
      {!isSearching && files.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Filter files... (e.g. Header, Search, Hero)"
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

      {isSearching ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
          Loading files...
        </div>
      ) : error ? (
        <div style={{ padding: 16, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <div style={{ maxHeight: 250, overflow: 'auto' }}>
          {filteredFiles.map((file, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(file.path)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderBottom: '1px solid #f1f5f9',
                background: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#0f172a',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FileText size={12} /> {file.path}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Shared header for results/browse views
function ResultsHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div style={{
      padding: '8px 12px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
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

// File result item
interface FileResultItemProps {
  path: string;
  preview?: string;
  isLast: boolean;
  onSelect: () => void;
}

function FileResultItem({ path, preview, isLast, onSelect }: FileResultItemProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid #e2e8f0',
        background: '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        color: '#0f172a',
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <FileText size={12} /> {path}
      </div>
      {preview && (
        <div style={{
          fontSize: 11,
          color: '#64748b',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {preview}
        </div>
      )}
    </button>
  );
}
