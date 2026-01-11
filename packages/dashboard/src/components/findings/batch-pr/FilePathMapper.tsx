import { useState, useCallback } from 'react';
import { Button, Spinner } from '../../ui';
import { SeverityDot } from './SeverityDot';
import { findCodeInJsx, extractTextContent, htmlToJsx } from '../apply-fix/utils';
import type { GitHubRepo, GitHubBranch } from '../../../types/github';
import type { FindingWithFix } from '../../../types/batch-pr';

interface FilePathMapperProps {
  selectedRepo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  findings: FindingWithFix[];
  prTitle: string;
  prDescription: string;
  isLoading: boolean;
  error: string | null;
  onBranchChange: (branch: string) => void;
  onFilePathChange: (index: number, path: string) => void;
  onRemoveFinding: (index: number) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onChangeRepo: () => void;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  // New props for file detection
  searchCode?: (owner: string, repo: string, query: string) => Promise<Array<{ path: string }>>;
  getFileContent?: (owner: string, repo: string, path: string, branch: string) => Promise<string | null>;
}

interface FileDetectionResult {
  path: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  lineStart?: number;
}

interface FindingDetectionState {
  isDetecting: boolean;
  result: FileDetectionResult | null;
  showSearch: boolean;
  showPreview: boolean;
}

export function FilePathMapper({
  selectedRepo,
  branches,
  selectedBranch,
  findings,
  prTitle,
  prDescription,
  isLoading,
  error,
  onBranchChange,
  onFilePathChange,
  onRemoveFinding,
  onTitleChange,
  onDescriptionChange,
  onChangeRepo,
  onBack,
  onCancel,
  onSubmit,
  searchCode,
  getFileContent,
}: FilePathMapperProps) {
  const fixedFindings = findings.filter(f => f.fix);
  const withPathCount = fixedFindings.filter(f => f.filePath.trim()).length;
  
  // Detection state per finding
  const [detectionStates, setDetectionStates] = useState<Record<string, FindingDetectionState>>({});
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Extract text content from HTML for display
  const getTextPreview = (html: string): string | null => {
    const text = extractTextContent(html);
    if (text && text.length > 2 && text.length < 50) {
      return text;
    }
    return null;
  };

  // Detect file for a single finding
  const detectFile = useCallback(async (item: FindingWithFix, index: number) => {
    if (!searchCode || !getFileContent || !item.fix) return;

    const findingId = item.finding.id;
    setDetectionStates(prev => ({
      ...prev,
      [findingId]: { ...prev[findingId], isDetecting: true, result: null }
    }));

    try {
      const originalHtml = item.fix.original.code;
      const textContent = extractTextContent(originalHtml);
      
      // Build search queries
      const queries: string[] = [];
      
      // Try text content first
      if (textContent && textContent.length > 3) {
        queries.push(textContent);
      }
      
      // Try selector classes
      const classMatch = item.finding.selector.match(/\.([a-zA-Z][\w-]+)/g);
      if (classMatch) {
        const significantClasses = classMatch
          .map(c => c.slice(1))
          .filter(c => c.length > 5 && !c.match(/^(sm:|md:|lg:|xl:|hover:|focus:)/))
          .slice(0, 2);
        if (significantClasses.length > 0) {
          queries.push(significantClasses.join(' '));
        }
      }

      if (queries.length === 0) {
        setDetectionStates(prev => ({
          ...prev,
          [findingId]: {
            isDetecting: false,
            result: { path: '', confidence: 'low', reason: 'No searchable content found' },
            showSearch: false,
            showPreview: false
          }
        }));
        return;
      }

      // Search for files
      let bestMatch: FileDetectionResult | null = null;

      for (const query of queries) {
        try {
          const results = await searchCode(
            selectedRepo.owner.login,
            selectedRepo.name,
            query
          );

          if (results.length > 0) {
            // Filter to component files
            const componentFiles = results.filter(r => 
              r.path.match(/\.(tsx?|jsx?)$/) &&
              !r.path.includes('node_modules') &&
              !r.path.includes('.test.') &&
              !r.path.includes('.spec.')
            );

            if (componentFiles.length > 0) {
              const topResult = componentFiles[0];
              
              // Verify match by loading file content
              const content = await getFileContent(
                selectedRepo.owner.login,
                selectedRepo.name,
                topResult.path,
                selectedBranch
              );

              if (content) {
                const match = findCodeInJsx(content, originalHtml, textContent);
                
                if (match) {
                  bestMatch = {
                    path: topResult.path,
                    confidence: match.confidence,
                    reason: match.reason,
                    lineStart: match.lineStart,
                  };
                  break;
                } else {
                  // File found but no exact match
                  bestMatch = {
                    path: topResult.path,
                    confidence: 'low',
                    reason: 'File found, but exact code location unclear',
                  };
                }
              }
            }
          }
        } catch (err) {
          console.error('[FilePathMapper] Search error:', err);
        }
      }

      if (bestMatch) {
        // Auto-fill the path
        onFilePathChange(index, bestMatch.path);
        setDetectionStates(prev => ({
          ...prev,
          [findingId]: {
            isDetecting: false,
            result: bestMatch,
            showSearch: false,
            showPreview: false
          }
        }));
      } else {
        setDetectionStates(prev => ({
          ...prev,
          [findingId]: {
            isDetecting: false,
            result: { path: '', confidence: 'low', reason: 'No matching files found' },
            showSearch: false,
            showPreview: false
          }
        }));
      }
    } catch (err) {
      console.error('[FilePathMapper] Detection error:', err);
      setDetectionStates(prev => ({
        ...prev,
        [findingId]: {
          isDetecting: false,
          result: null,
          showSearch: false,
          showPreview: false
        }
      }));
    }
  }, [searchCode, getFileContent, selectedRepo, selectedBranch, onFilePathChange]);

  // Auto-detect all files
  const handleAutoDetectAll = useCallback(async () => {
    setIsAutoDetecting(true);
    
    for (let i = 0; i < findings.length; i++) {
      const item = findings[i];
      if (item.fix && !item.filePath.trim()) {
        await detectFile(item, i);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    setIsAutoDetecting(false);
  }, [findings, detectFile]);

  // Toggle preview for a finding
  const togglePreview = (findingId: string) => {
    setDetectionStates(prev => ({
      ...prev,
      [findingId]: {
        ...prev[findingId],
        showPreview: !prev[findingId]?.showPreview
      }
    }));
  };

  // Count mapped with confidence
  const mappedWithHighConfidence = fixedFindings.filter(f => {
    const state = detectionStates[f.finding.id];
    return f.filePath.trim() && state?.result?.confidence === 'high';
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RepoHeader
        repo={selectedRepo}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={onBranchChange}
        onChangeRepo={onChangeRepo}
      />

      <FilePathList
        findings={fixedFindings}
        allFindings={findings}
        withPathCount={withPathCount}
        detectionStates={detectionStates}
        isAutoDetecting={isAutoDetecting}
        onFilePathChange={onFilePathChange}
        onRemoveFinding={onRemoveFinding}
        onDetectFile={detectFile}
        onTogglePreview={togglePreview}
        onAutoDetectAll={handleAutoDetectAll}
        getTextPreview={getTextPreview}
        hasSearchCapability={!!searchCode && !!getFileContent}
      />

      <PRFormFields
        prTitle={prTitle}
        prDescription={prDescription}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />

      {error && <ErrorMessage message={error} />}

      <FormActions
        isLoading={isLoading}
        withPathCount={withPathCount}
        totalCount={fixedFindings.length}
        highConfidenceCount={mappedWithHighConfidence}
        onBack={onBack}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface RepoHeaderProps {
  repo: GitHubRepo;
  branches: GitHubBranch[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  onChangeRepo: () => void;
}

function RepoHeader({ repo, branches, selectedBranch, onBranchChange, onChangeRepo }: RepoHeaderProps) {
  return (
    <div style={{
      padding: 12,
      background: '#f8fafc',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <img
        src={repo.owner.avatar_url}
        alt=""
        style={{ width: 32, height: 32, borderRadius: 6 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{repo.full_name}</div>
        <button
          onClick={onChangeRepo}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Change repository
        </button>
      </div>
      <select
        value={selectedBranch}
        onChange={e => onBranchChange(e.target.value)}
        style={{
          padding: '6px 10px',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        {branches.map(branch => (
          <option key={branch.name} value={branch.name}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FilePathListProps {
  findings: FindingWithFix[];
  allFindings: FindingWithFix[];
  withPathCount: number;
  detectionStates: Record<string, FindingDetectionState>;
  isAutoDetecting: boolean;
  onFilePathChange: (index: number, path: string) => void;
  onRemoveFinding: (index: number) => void;
  onDetectFile: (item: FindingWithFix, index: number) => void;
  onTogglePreview: (findingId: string) => void;
  onAutoDetectAll: () => void;
  getTextPreview: (html: string) => string | null;
  hasSearchCapability: boolean;
}

function FilePathList({ 
  findings, 
  allFindings, 
  withPathCount, 
  detectionStates,
  isAutoDetecting,
  onFilePathChange, 
  onRemoveFinding,
  onDetectFile,
  onTogglePreview,
  onAutoDetectAll,
  getTextPreview,
  hasSearchCapability,
}: FilePathListProps) {
  const unmappedCount = findings.filter(f => !f.filePath.trim()).length;

  return (
    <div>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <label style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: '#475569', 
        }}>
          File Paths ({withPathCount}/{findings.length} mapped)
        </label>
        
        {hasSearchCapability && unmappedCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAutoDetectAll}
            disabled={isAutoDetecting}
          >
            {isAutoDetecting ? (
              <>
                <Spinner size={12} /> Detecting...
              </>
            ) : (
              <>🔍 Auto-detect All</>
            )}
          </Button>
        )}
      </div>
      
      <div style={{ 
        maxHeight: 300, 
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}>
        {findings.map((item) => {
          const originalIndex = allFindings.indexOf(item);
          const state = detectionStates[item.finding.id];
          
          return (
            <FilePathRow
              key={item.finding.id}
              item={item}
              detectionState={state}
              textPreview={item.fix ? getTextPreview(item.fix.original.code) : null}
              hasSearchCapability={hasSearchCapability}
              onFilePathChange={(path) => onFilePathChange(originalIndex, path)}
              onRemove={() => onRemoveFinding(originalIndex)}
              onDetect={() => onDetectFile(item, originalIndex)}
              onTogglePreview={() => onTogglePreview(item.finding.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface FilePathRowProps {
  item: FindingWithFix;
  detectionState?: FindingDetectionState;
  textPreview: string | null;
  hasSearchCapability: boolean;
  onFilePathChange: (path: string) => void;
  onRemove: () => void;
  onDetect: () => void;
  onTogglePreview: () => void;
}

function FilePathRow({ 
  item, 
  detectionState, 
  textPreview,
  hasSearchCapability,
  onFilePathChange, 
  onRemove,
  onDetect,
  onTogglePreview,
}: FilePathRowProps) {
  const isDetecting = detectionState?.isDetecting;
  const result = detectionState?.result;
  const showPreview = detectionState?.showPreview;
  const hasMappedPath = item.filePath.trim().length > 0;

  return (
    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
      {/* Main Row */}
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        {/* Status indicator */}
        <div style={{ paddingTop: 2 }}>
          {hasMappedPath ? (
            <span style={{ color: '#16a34a', fontSize: 14 }}>✅</span>
          ) : (
            <SeverityDot severity={item.finding.impact} />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}>
            <span style={{ 
              fontSize: 13, 
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.finding.ruleTitle}
            </span>
            
            {/* Text preview badge */}
            {textPreview && (
              <span style={{
                fontSize: 11,
                color: '#64748b',
                background: '#f1f5f9',
                padding: '1px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 120,
              }}>
                "{textPreview}"
              </span>
            )}
            
            {/* Confidence badge */}
            {result && hasMappedPath && (
              <ConfidenceBadge confidence={result.confidence} />
            )}
          </div>

          {/* File path input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="src/components/Example.tsx"
              value={item.filePath}
              onChange={e => onFilePathChange(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
            
            {/* Search/Detect button */}
            {hasSearchCapability && !hasMappedPath && (
              <button
                onClick={onDetect}
                disabled={isDetecting}
                style={{
                  padding: '6px 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: isDetecting ? 'wait' : 'pointer',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDetecting ? <Spinner size={12} /> : '🔍 Search'}
              </button>
            )}
          </div>

          {/* Detection result hint */}
          {result && !hasMappedPath && result.reason && (
            <div style={{
              fontSize: 11,
              color: '#94a3b8',
              marginTop: 4,
            }}>
              {result.reason}
            </div>
          )}

          {/* Preview toggle */}
          {item.fix && (
            <button
              onClick={onTogglePreview}
              style={{
                marginTop: 6,
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: 11,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {showPreview ? '▼' : '▶'} Preview fix
            </button>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            fontSize: 16,
          }}
          title="Remove from PR"
        >
          ×
        </button>
      </div>

      {/* Expanded Preview */}
      {showPreview && item.fix && (
        <FixPreview
          originalCode={item.fix.original.code}
          fixedCode={item.fix.fixes.html}
        />
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: { bg: '#dcfce7', color: '#166534', icon: '🎯', label: 'High' },
    medium: { bg: '#fef3c7', color: '#92400e', icon: '~', label: 'Medium' },
    low: { bg: '#fee2e2', color: '#991b1b', icon: '?', label: 'Low' },
  };
  
  const style = styles[confidence];
  
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 500,
      padding: '2px 6px',
      borderRadius: 4,
      background: style.bg,
      color: style.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
    }}>
      {style.icon} {style.label}
    </span>
  );
}

function FixPreview({ originalCode, fixedCode }: { originalCode: string; fixedCode: string }) {
  const fixedJsx = htmlToJsx(fixedCode);
  
  return (
    <div style={{
      padding: '0 12px 12px 32px',
      background: '#f8fafc',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        fontSize: 11,
        fontFamily: 'ui-monospace, monospace',
      }}>
        <div>
          <div style={{ 
            fontSize: 10, 
            fontWeight: 500, 
            color: '#991b1b', 
            marginBottom: 4 
          }}>
            Before:
          </div>
          <pre style={{
            margin: 0,
            padding: 8,
            background: '#fff5f5',
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 80,
            whiteSpace: 'pre-wrap',
            color: '#991b1b',
          }}>
            {originalCode}
          </pre>
        </div>
        <div>
          <div style={{ 
            fontSize: 10, 
            fontWeight: 500, 
            color: '#166534', 
            marginBottom: 4 
          }}>
            After (JSX):
          </div>
          <pre style={{
            margin: 0,
            padding: 8,
            background: '#f0fdf4',
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 80,
            whiteSpace: 'pre-wrap',
            color: '#166534',
          }}>
            {fixedJsx}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface PRFormFieldsProps {
  prTitle: string;
  prDescription: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

function PRFormFields({ prTitle, prDescription, onTitleChange, onDescriptionChange }: PRFormFieldsProps) {
  return (
    <>
      <div>
        <label style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: '#475569', 
          marginBottom: 6, 
          display: 'block' 
        }}>
          PR Title
        </label>
        <input
          type="text"
          value={prTitle}
          onChange={e => onTitleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </div>

      <div>
        <label style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: '#475569', 
          marginBottom: 6, 
          display: 'block' 
        }}>
          Description (optional)
        </label>
        <textarea
          placeholder="Additional context for reviewers..."
          value={prDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical',
          }}
        />
      </div>
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{
      padding: 12,
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 8,
      color: '#dc2626',
      fontSize: 13,
    }}>
      {message}
    </div>
  );
}

interface FormActionsProps {
  isLoading: boolean;
  withPathCount: number;
  totalCount: number;
  highConfidenceCount: number;
  onBack: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function FormActions({ 
  isLoading, 
  withPathCount, 
  totalCount,
  highConfidenceCount,
  onBack, 
  onCancel, 
  onSubmit 
}: FormActionsProps) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 12, 
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTop: '1px solid #e2e8f0',
    }}>
      <Button variant="secondary" onClick={onBack}>
        ← Back
      </Button>
      
      <div style={{ flex: 1, textAlign: 'center' }}>
        {withPathCount > 0 && (
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {withPathCount} of {totalCount} ready
            {highConfidenceCount > 0 && ` (${highConfidenceCount} high confidence)`}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isLoading || withPathCount === 0}
        >
          {isLoading ? (
            <>
              <Spinner size={14} /> Creating...
            </>
          ) : (
            `🚀 Create PR (${withPathCount})`
          )}
        </Button>
      </div>
    </div>
  );
}