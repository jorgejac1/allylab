import { ReferenceLine } from 'recharts';

interface GoalReferenceLineProps {
  goal: number;
  label?: string;
  color?: string;
}

export function GoalReferenceLine({
  goal,
  label = `Goal: ${goal}`,
  color = '#f59e0b',
}: GoalReferenceLineProps) {
  return (
    <ReferenceLine
      y={goal}
      stroke={color}
      strokeDasharray="5 5"
      strokeWidth={2}
      label={{
        value: label,
        position: 'right',
        fill: color,
        fontSize: 11,
        fontWeight: 600,
      }}
    />
  );
}