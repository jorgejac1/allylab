import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TrendDataPoint } from "../../types";

interface TrendLineProps {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
  goalScore?: number; // Optional goal line
  showGoal?: boolean; // Deprecated: use goalScore instead
}

export function TrendLine({
  data,
  width = 600,
  height = 200,
  goalScore,
}: TrendLineProps) {
  // Calculate min/max for Y axis with padding
  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  
  // Include goal in range calculation if provided
  const rangeMin = goalScore ? Math.min(minScore, goalScore) : minScore;
  const rangeMax = goalScore ? Math.max(maxScore, goalScore) : maxScore;
  
  const yMin = Math.max(0, Math.floor(rangeMin / 10) * 10 - 10);
  const yMax = Math.min(100, Math.ceil(rangeMax / 10) * 10 + 10);

  // Determine line color based on trend
  const firstScore = data[0]?.score ?? 0;
  const lastScore = data[data.length - 1]?.score ?? 0;
  const trendColor = lastScore >= firstScore ? "#10b981" : "#ef4444";

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            padding: "8px 12px",
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => {
            if (name === "score" && typeof value === "number") return [`${value}/100`, "Score"];
            return [value ?? 0, name];
          }}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;
            if (item?.fullDate) {
              return new Date(item.fullDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
            }
            return label;
          }}
        />
        
        {/* Goal Reference Line */}
        {goalScore && (
          <ReferenceLine
            y={goalScore}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Goal: ${goalScore}`,
              position: "right",
              fill: "#f59e0b",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        )}
        
        {/* Score Line */}
        <Line
          type="monotone"
          dataKey="score"
          stroke={trendColor}
          strokeWidth={2}
          dot={{
            fill: trendColor,
            strokeWidth: 2,
            r: 4,
          }}
          activeDot={{
            fill: trendColor,
            strokeWidth: 0,
            r: 6,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}