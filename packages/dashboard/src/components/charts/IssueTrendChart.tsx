import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { SEVERITY_COLORS } from '../../utils/constants';

interface IssueTrendDataPoint {
  date: string;
  fullDate?: string;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

interface IssueTrendChartProps {
  data: IssueTrendDataPoint[];
  height?: number;
  chartType?: 'line' | 'area';
  showTotal?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: IssueTrendDataPoint;
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

function TooltipRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
        />
        <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
      </span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

// Properly typed CustomTooltip
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload;
  const total = dataPoint?.total ?? 0;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TooltipRow label="Critical" value={dataPoint?.critical ?? 0} color={SEVERITY_COLORS.critical} />
        <TooltipRow label="Serious" value={dataPoint?.serious ?? 0} color={SEVERITY_COLORS.serious} />
        <TooltipRow label="Moderate" value={dataPoint?.moderate ?? 0} color={SEVERITY_COLORS.moderate} />
        <TooltipRow label="Minor" value={dataPoint?.minor ?? 0} color={SEVERITY_COLORS.minor} />
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            marginTop: 4,
            paddingTop: 4,
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
          }}
        >
          <span style={{ color: '#64748b' }}>Total</span>
          <span style={{ color: '#0f172a' }}>{total}</span>
        </div>
      </div>
    </div>
  );
}

export function IssueTrendChart({
  data,
  height = 250,
  chartType = 'area',
  showTotal = false,
}: IssueTrendChartProps) {
  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
        Need at least 2 scans to show issue trends.
      </div>
    );
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.8} />
              <stop offset="95%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorSerious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SEVERITY_COLORS.serious} stopOpacity={0.8} />
              <stop offset="95%" stopColor={SEVERITY_COLORS.serious} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorModerate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SEVERITY_COLORS.moderate} stopOpacity={0.8} />
              <stop offset="95%" stopColor={SEVERITY_COLORS.moderate} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorMinor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SEVERITY_COLORS.minor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={SEVERITY_COLORS.minor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value: string) => (
              <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="critical"
            name="Critical"
            stackId="1"
            stroke={SEVERITY_COLORS.critical}
            fill="url(#colorCritical)"
          />
          <Area
            type="monotone"
            dataKey="serious"
            name="Serious"
            stackId="1"
            stroke={SEVERITY_COLORS.serious}
            fill="url(#colorSerious)"
          />
          <Area
            type="monotone"
            dataKey="moderate"
            name="Moderate"
            stackId="1"
            stroke={SEVERITY_COLORS.moderate}
            fill="url(#colorModerate)"
          />
          <Area
            type="monotone"
            dataKey="minor"
            name="Minor"
            stackId="1"
            stroke={SEVERITY_COLORS.minor}
            fill="url(#colorMinor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Line chart variant
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(value: string) => (
            <span style={{ color: '#64748b', fontSize: 12 }}>{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="critical"
          name="Critical"
          stroke={SEVERITY_COLORS.critical}
          strokeWidth={2}
          dot={{ fill: SEVERITY_COLORS.critical, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="serious"
          name="Serious"
          stroke={SEVERITY_COLORS.serious}
          strokeWidth={2}
          dot={{ fill: SEVERITY_COLORS.serious, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="moderate"
          name="Moderate"
          stroke={SEVERITY_COLORS.moderate}
          strokeWidth={2}
          dot={{ fill: SEVERITY_COLORS.moderate, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="minor"
          name="Minor"
          stroke={SEVERITY_COLORS.minor}
          strokeWidth={2}
          dot={{ fill: SEVERITY_COLORS.minor, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
        {showTotal && (
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#64748b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}