import { Card, SeverityBadge } from '../ui';
import { analyzePatterns, calculateEfficiencyGain } from '../../utils/patterns';
import type { Finding } from '../../types';
import { Brain, RefreshCw, Globe, FileText, Sparkles } from 'lucide-react';

interface IssuePatternsProps {
  findings: Finding[];
}

export function IssuePatterns({ findings }: IssuePatternsProps) {
  const patterns = analyzePatterns(findings);
  const efficiencyGain = calculateEfficiencyGain(patterns);
  const templateIssues = patterns.filter(p => p.type === 'template').reduce((sum, p) => sum + p.count, 0);

  return (
    <Card>
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Brain size={18} /> Smart Issue Analysis
        <span className="text-xs font-normal text-slate-500">Pattern detection & deduplication</span>
      </h3>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="TOTAL ISSUES FOUND" value={findings.length} />
        <StatBox label="UNIQUE ISSUE TYPES" value={patterns.length} />
        <StatBox label="EFFICIENCY GAIN" value={`${efficiencyGain}%`} subtext={`Fix ${patterns.length} to solve ${findings.length}`} />
        <StatBox label="COMPONENT ISSUES" value={templateIssues} subtext="Fix once, affect many" />
      </div>

      {/* Patterns Table */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-3">All Issue Patterns</div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-3 text-left text-[11px] font-semibold text-slate-500 uppercase">Issue</th>
              <th className="p-3 text-center text-[11px] font-semibold text-slate-500 uppercase">Type</th>
              <th className="p-3 text-center text-[11px] font-semibold text-slate-500 uppercase">Count</th>
              <th className="p-3 text-center text-[11px] font-semibold text-slate-500 uppercase">Pages</th>
              <th className="p-3 text-left text-[11px] font-semibold text-slate-500 uppercase">Fix Strategy</th>
            </tr>
          </thead>
          <tbody>
            {patterns.slice(0, 10).map(pattern => (
              <tr key={pattern.ruleId} className="border-b border-slate-50">
                <td className="p-3 align-middle">
                  <div className="font-medium">{pattern.ruleTitle}</div>
                  <SeverityBadge severity={pattern.severity} />
                </td>
                <td className="p-3 align-middle text-center">
                  <span
                    className="py-1 px-2 rounded text-[11px]"
                    style={{
                      background: pattern.type === 'template' ? '#dbeafe' : '#f1f5f9',
                      color: pattern.type === 'template' ? '#1d4ed8' : '#64748b',
                    }}
                  >
                    {pattern.type === 'template' ? <><RefreshCw size={10} className="mr-1" />Template</> : pattern.type === 'global' ? <><Globe size={10} className="mr-1" />Global</> : <><FileText size={10} className="mr-1" />Page</>}
                  </span>
                </td>
                <td className="p-3 align-middle text-center font-bold text-lg">
                  {pattern.count}
                </td>
                <td className="p-3 align-middle text-center">{pattern.pages}</td>
                <td className="p-3 align-middle">
                  <span className="text-blue-600 text-[13px]">{pattern.fixStrategy}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommended Fix Order */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-[13px] font-semibold mb-2 inline-flex items-center gap-1.5"><Sparkles size={14} /> Recommended Fix Order</div>
        <ol className="m-0 pl-5 text-[13px] text-blue-800 leading-[1.8]">
          <li><strong>Component Issues ({templateIssues}):</strong> Highest ROI - fix {patterns.filter(p => p.type === 'template').length} issues to resolve {templateIssues} total occurrences</li>
          <li><strong>Global Issues ({patterns.filter(p => p.type === 'global').length}):</strong> Systematic fixes affecting all pages</li>
          <li><strong>Remaining Issues:</strong> Address page-by-page in order of severity</li>
        </ol>
      </div>
    </Card>
  );
}

function StatBox({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="text-center p-4 bg-slate-50 rounded-lg">
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className="text-[32px] font-bold">{value}</div>
      {subtext && <div className="text-[11px] text-slate-500">{subtext}</div>}
    </div>
  );
}
