import { useState } from 'react';
import { Card, Button, Input, EmptyState, Toast } from '../ui';
import { useCompetitors, useToast } from '../../hooks';
import type { BenchmarkData } from '../../types';
import { Plus, Trophy, RefreshCw, Loader2, BarChart3, Trash2 } from 'lucide-react';
import { getScoreColor, getScoreGrade } from '../../utils/scoreUtils';

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
    <div className="flex flex-col gap-6">
      {/* Toast Container */}
      <Toast toasts={toasts} onClose={closeToast} />

      {/* Summary Cards */}
      {benchmarkData && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
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
        <h3 className="text-base font-semibold m-0 mb-4 flex items-center gap-2">
          <Plus size={18} />Add Competitor
        </h3>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-[2] min-w-[200px]">
            <Input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://competitor.com"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold m-0 flex items-center gap-2">
            <Trophy size={18} />Competitor Comparison ({competitors.length})
          </h3>
          {competitors.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleScanAll}
              disabled={isScanning}
            >
              {isScanning ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Scanning...</> : <><RefreshCw size={14} className="mr-1.5" />Scan All</>}
            </Button>
          )}
        </div>

        {competitors.length === 0 ? (
          <EmptyState
            icon={<Trophy size={32} />}
            title="No Competitors Added"
            description="Add competitor URLs above to compare accessibility scores"
          />
        ) : (
          <div className="flex flex-col gap-3">
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
          <h3 className="text-base font-semibold m-0 mb-4 flex items-center gap-2">
            <BarChart3 size={18} />Score Comparison
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
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-[32px] font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-400">{subtext}</div>
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
      className={`flex items-center gap-4 p-4 rounded-lg ${
        isYours
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'bg-slate-50 border border-slate-200'
      }`}
    >
      {/* Site Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{name}</span>
          {isYours && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded">
              YOU
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">{domain}</div>
        {lastScanned && (
          <div className="text-[11px] text-slate-400 mt-0.5">
            Scanned: {new Date(lastScanned).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="text-center min-w-[80px]">
        {score !== undefined ? (
          <>
            <div
              className="text-2xl font-bold"
              style={{ color: getScoreColor(score) }}
            >
              {score}
            </div>
            <div
              className="text-xs font-semibold"
              style={{ color: getScoreColor(score) }}
            >
              {getScoreGrade(score)}
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-400">Not scanned</div>
        )}
      </div>

      {/* Actions */}
      {!isYours && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onScan}
            disabled={isScanning}
          >
            {isScanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500"
          >
            <Trash2 size={14} />
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
    <div className="flex flex-col gap-3">
      {allSites.map((site, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className={`w-[120px] text-sm ${site.isYours ? 'font-semibold' : 'font-normal'}`}>
            {site.name}
          </div>
          <div className="flex-1 bg-slate-200 rounded h-6">
            <div
              className="rounded h-full flex items-center justify-end pr-2 min-w-[40px]"
              style={{
                width: `${(site.score / maxScore) * 100}%`,
                background: site.isYours ? '#3b82f6' : getScoreColor(site.score),
              }}
            >
              <span className="text-xs font-semibold text-white">
                {site.score}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
