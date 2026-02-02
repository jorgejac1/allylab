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
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={18} /> Smart Issue Analysis
        <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>Pattern detection & deduplication</span>
      </h3>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatBox label="TOTAL ISSUES FOUND" value={findings.length} />
        <StatBox label="UNIQUE ISSUE TYPES" value={patterns.length} />
        <StatBox label="EFFICIENCY GAIN" value={`${efficiencyGain}%`} subtext={`Fix ${patterns.length} to solve ${findings.length}`} />
        <StatBox label="COMPONENT ISSUES" value={templateIssues} subtext="Fix once, affect many" />
      </div>

      {/* Patterns Table */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>All Issue Patterns</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={thStyle}>Issue</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Type</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Count</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Pages</th>
              <th style={thStyle}>Fix Strategy</th>
            </tr>
          </thead>
          <tbody>
            {patterns.slice(0, 10).map(pattern => (
              <tr key={pattern.ruleId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{pattern.ruleTitle}</div>
                  <SeverityBadge severity={pattern.severity} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: pattern.type === 'template' ? '#dbeafe' : '#f1f5f9',
                    color: pattern.type === 'template' ? '#1d4ed8' : '#64748b',
                  }}>
                    {pattern.type === 'template' ? <><RefreshCw size={10} style={{ marginRight: 4 }} />Template</> : pattern.type === 'global' ? <><Globe size={10} style={{ marginRight: 4 }} />Global</> : <><FileText size={10} style={{ marginRight: 4 }} />Page</>}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: 18 }}>
                  {pattern.count}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{pattern.pages}</td>
                <td style={tdStyle}>
                  <span style={{ color: '#2563eb', fontSize: 13 }}>{pattern.fixStrategy}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommended Fix Order */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> Recommended Fix Order</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#1e40af', lineHeight: 1.8 }}>
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
    <div style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
      {subtext && <div style={{ fontSize: 11, color: '#64748b' }}>{subtext}</div>}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  verticalAlign: 'middle',
};