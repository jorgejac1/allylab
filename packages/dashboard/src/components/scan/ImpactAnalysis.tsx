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
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Zap size={18} /> Resource & Impact Analysis
        <span className="text-xs font-normal text-slate-500">
          Development capacity and business impact assessment
        </span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Dev Time */}
        <div className="bg-slate-50 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-500 mb-2">DEVELOPER CAPACITY NEEDED</div>
          <div className="text-slate-800 font-bold" style={{ fontSize: 42 }}>{devTime.totalHours}h</div>
          <div className="text-sm text-slate-500">
            {devTime.devWeeks} dev weeks · {devTime.sprints} sprints
          </div>
        </div>

        {/* Risk Level */}
        <div
          className="rounded-xl p-5 text-center"
          style={{
            background: riskStyle.bg,
            border: `1px solid ${riskStyle.border}`,
          }}
        >
          <div className="text-xs text-slate-500 mb-2">LEGAL RISK ASSESSMENT</div>
          <div className="font-bold" style={{ fontSize: 32, color: riskStyle.text }}>{risk.label}</div>
          <div className="text-sm" style={{ color: riskStyle.text }}>{risk.description}</div>
        </div>

        {/* Audience Impact */}
        <div className="rounded-xl p-5 text-center bg-green-50">
          <div className="text-xs text-slate-500 mb-2">AUDIENCE IMPACT</div>
          <div className="text-2xl font-bold text-green-800">+20% potential audience</div>
          <div className="text-sm text-green-800">Improved accessibility = wider reach</div>
        </div>
      </div>

      {/* Time by Severity */}
      <div className="mb-6">
        <div className="text-sm font-semibold mb-3">Time Investment by Severity</div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 rounded-lg p-3 text-center bg-red-50">
            <div className="inline-block text-white rounded py-0.5 px-2 text-xs mb-2 bg-red-600">Critical</div>
            <div className="text-2xl font-bold">{devTime.bySeverity.critical}h</div>
            <div className="text-xs text-slate-500">Immediate Priority</div>
          </div>
          <div className="flex-1 rounded-lg p-3 text-center bg-orange-50">
            <div className="inline-block text-white rounded py-0.5 px-2 text-xs mb-2 bg-orange-600">Serious</div>
            <div className="text-2xl font-bold">{devTime.bySeverity.serious}h</div>
            <div className="text-xs text-slate-500">High Priority</div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="rounded-lg p-4 bg-amber-50 border border-amber-200">
        <div className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5"><BarChart3 size={14} /> Enterprise Impact Metrics</div>
        <ul className="text-sm m-0 pl-5 text-amber-900" style={{ lineHeight: 1.8 }}>
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