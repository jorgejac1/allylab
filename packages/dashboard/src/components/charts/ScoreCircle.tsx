import { getScoreColor, getScoreGrade } from '../../utils/scoring';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showGrade?: boolean;
}

export function ScoreCircle({
  score,
  size = 100,
  strokeWidth,
  showGrade = false
}: ScoreCircleProps) {
  const stroke = strokeWidth || size * 0.08;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="font-bold leading-none" style={{ fontSize: size * 0.28, color }}>
          {score}
        </div>
        {showGrade && (
          <div className="text-slate-500 mt-0.5" style={{ fontSize: size * 0.14 }}>
            Grade {getScoreGrade(score)}
          </div>
        )}
      </div>
    </div>
  );
}
