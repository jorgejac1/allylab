import { Card } from '../ui';
import type { ScanResult } from '../../types';
import { calculateDevTime, getRiskAssessment } from '../../utils/devTime';
import { Zap, BarChart3 } from 'lucide-react';

interface ImpactAnalysisProps {
  result: ScanResult;
}

export function ImpactAnalysis({ result }: ImpactAnalysisProps) {
  const devTime = calculateDevTime(result);
  const risk = getRiskAssessment(result.critical, result.serious);

  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    high: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
    medium: { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
    low: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  };

  const riskStyle = riskColors[risk.level];

  return (
    <Card>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={18} /> Resource & Impact Analysis
        <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>
          Development capacity and business impact assessment
        </span>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Dev Time */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>DEVELOPER CAPACITY NEEDED</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: '#1e293b' }}>{devTime.totalHours}h</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {devTime.devWeeks} dev weeks · {devTime.sprints} sprints
          </div>
        </div>

        {/* Risk Level */}
        <div
          style={{
            background: riskStyle.bg,
            border: `1px solid ${riskStyle.border}`,
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>LEGAL RISK ASSESSMENT</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: riskStyle.text }}>{risk.label}</div>
          <div style={{ fontSize: 13, color: riskStyle.text }}>{risk.description}</div>
        </div>

        {/* Audience Impact */}
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>AUDIENCE IMPACT</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>+20% potential audience</div>
          <div style={{ fontSize: 13, color: '#166534' }}>Improved accessibility = wider reach</div>
        </div>
      </div>

      {/* Time by Severity */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Time Investment by Severity</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: '#fef2f2', borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div style={{ background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, display: 'inline-block', marginBottom: 8 }}>Critical</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{devTime.bySeverity.critical}h</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Immediate Priority</div>
          </div>
          <div style={{ flex: 1, background: '#fff7ed', borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div style={{ background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, display: 'inline-block', marginBottom: 8 }}>Serious</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{devTime.bySeverity.serious}h</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>High Priority</div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} /> Enterprise Impact Metrics</div>
        <ul style={{ fontSize: 13, color: '#78350f', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Legal Exposure:</strong> 4,000+ ADA lawsuits filed in 2023, settlements range $70K-$250K+</li>
          <li><strong>User Behavior:</strong> 71% of users with disabilities leave inaccessible sites immediately</li>
          <li><strong>Market Size:</strong> 1.3 billion people (16% of global population) have disabilities</li>
          <li><strong>Brand Risk:</strong> Accessibility lawsuits generate negative press and brand damage</li>
          <li><strong>Business Value:</strong> Accessible sites see average 20% increase in conversions</li>
        </ul>
      </div>
    </Card>
  );
}