import { useState } from 'react';
import { Card, Button, Input, EmptyState, Toast } from '../ui';
import { useCompetitors, useToast } from '../../hooks';
import type { BenchmarkData } from '../../types';

interface CompetitorBenchmarkProps {
  yourSiteUrl?: string;
  yourSiteScore?: number;
}

export function CompetitorBenchmark({ yourSiteUrl, yourSiteScore }: CompetitorBenchmarkProps) {
  const {
    competitors,
    isScanning,
    scanningId,
    addCompetitor,
    removeCompetitor,
    scanCompetitor,
    scanAll,
    getBenchmarkData,
  } = useCompetitors(yourSiteUrl, yourSiteScore);

  const { toasts, success, error, warning, closeToast } = useToast();

  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');

  const benchmarkData = getBenchmarkData();

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    
    try {
      new URL(newUrl); // Validate URL
      addCompetitor(newUrl.trim(), newName.trim() || undefined);
      success(`Added competitor: ${newName.trim() || new URL(newUrl).hostname}`);
      setNewUrl('');
      setNewName('');
    } catch {
      warning('Please enter a valid URL (e.g., https://example.com)');
    }
  };

  const handleRemove = (id: string, name: string) => {
    removeCompetitor(id);
    success(`Removed competitor: ${name}`);
  };

  const handleScanAll = async () => {
    try {
      await scanAll();
      success('All competitors scanned successfully');
    } catch {
      error('Failed to scan some competitors');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Container */}
      <Toast toasts={toasts} onClose={closeToast} />

      {/* Summary Cards */}
      {benchmarkData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <SummaryCard
            label="Your Rank"
            value={`#${benchmarkData.summary.yourRank}`}
            subtext={`of ${benchmarkData.summary.totalCompetitors + 1} sites`}
            color="#2563eb"
          />
          <SummaryCard
            label="Beating"
            value={benchmarkData.summary.beating.toString()}
            subtext="competitors"
            color="#10b981"
          />
          <SummaryCard
            label="Losing To"
            value={benchmarkData.summary.losingTo.toString()}
            subtext="competitors"
            color={benchmarkData.summary.losingTo > 0 ? '#ef4444' : '#10b981'}
          />
          <SummaryCard
            label="Avg Score"
            value={benchmarkData.summary.averageScore.toString()}
            subtext="across all sites"
            color="#64748b"
          />
        </div>
      )}

      {/* Add Competitor */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          ➕ Add Competitor
        </h3>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <Input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://competitor.com"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Name (optional)"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} disabled={!newUrl.trim()}>
            + Add
          </Button>
        </div>
      </Card>

      {/* Competitors List */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            🏆 Competitor Comparison ({competitors.length})
          </h3>
          {competitors.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleScanAll}
              disabled={isScanning}
            >
              {isScanning ? '⏳ Scanning...' : '🔄 Scan All'}
            </Button>
          )}
        </div>

        {competitors.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No Competitors Added"
            description="Add competitor URLs above to compare accessibility scores"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Your Site (if available) */}
            {yourSiteUrl && yourSiteScore !== undefined && (
              <CompetitorRow
                name="Your Site"
                url={yourSiteUrl}
                score={yourSiteScore}
                isYours
              />
            )}

            {/* Competitors sorted by score */}
            {[...competitors]
              .sort((a, b) => (b.lastScore ?? 0) - (a.lastScore ?? 0))
              .map(competitor => (
                <CompetitorRow
                  key={competitor.id}
                  name={competitor.name}
                  url={competitor.url}
                  score={competitor.lastScore}
                  lastScanned={competitor.lastScanned}
                  isScanning={scanningId === competitor.id}
                  onScan={() => scanCompetitor(competitor)}
                  onDelete={() => handleRemove(competitor.id, competitor.name)}
                />
              ))}
          </div>
        )}
      </Card>

      {/* Score Comparison Chart */}
      {benchmarkData && benchmarkData.competitors.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
            📊 Score Comparison
          </h3>
          <ScoreBarChart data={benchmarkData} />
        </Card>
      )}
    </div>
  );
}

// ============================================
// Summary Card Component
// ============================================

interface SummaryCardProps {
  label: string;
  value: string;
  subtext: string;
  color: string;
}

function SummaryCard({ label, value, subtext, color }: SummaryCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{subtext}</div>
    </div>
  );
}

// ============================================
// Competitor Row Component
// ============================================

interface CompetitorRowProps {
  name: string;
  url: string;
  score?: number;
  lastScanned?: string;
  isYours?: boolean;
  isScanning?: boolean;
  onScan?: () => void;
  onDelete?: () => void;
}

function CompetitorRow({
  name,
  url,
  score,
  lastScanned,
  isYours,
  isScanning,
  onScan,
  onDelete,
}: CompetitorRowProps) {
  const domain = new URL(url).hostname;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: isYours ? '#eff6ff' : '#f8fafc',
        borderRadius: 8,
        border: isYours ? '2px solid #3b82f6' : '1px solid #e2e8f0',
      }}
    >
      {/* Site Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {isYours && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                background: '#3b82f6',
                color: '#fff',
                borderRadius: 4,
              }}
            >
              YOU
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{domain}</div>
        {lastScanned && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Scanned: {new Date(lastScanned).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', minWidth: 80 }}>
        {score !== undefined ? (
          <>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: getScoreColor(score),
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: getScoreColor(score),
              }}
            >
              {getGrade(score)}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: '#94a3b8' }}>Not scanned</div>
        )}
      </div>

      {/* Actions */}
      {!isYours && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onScan}
            disabled={isScanning}
          >
            {isScanning ? '⏳' : '🔄'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            style={{ color: '#ef4444' }}
          >
            🗑️
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Score Bar Chart Component
// ============================================

interface ScoreBarChartProps {
  data: BenchmarkData;
}

function ScoreBarChart({ data }: ScoreBarChartProps) {
  const allSites = [
    { name: 'Your Site', score: data.yourSite.score, isYours: true },
    ...data.competitors.map(c => ({ name: c.name, score: c.score, isYours: false })),
  ].sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...allSites.map(s => s.score));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {allSites.map((site, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 120, fontSize: 13, fontWeight: site.isYours ? 600 : 400 }}>
            {site.name}
          </div>
          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 24 }}>
            <div
              style={{
                width: `${(site.score / maxScore) * 100}%`,
                background: site.isYours ? '#3b82f6' : getScoreColor(site.score),
                borderRadius: 4,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8,
                minWidth: 40,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                {site.score}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#ea580c';
  return '#dc2626';
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}