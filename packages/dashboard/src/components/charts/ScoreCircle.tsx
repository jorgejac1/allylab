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
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
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
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: size * 0.28, fontWeight: 700, color, lineHeight: 1 }}>
          {score}
        </div>
        {showGrade && (
          <div style={{ fontSize: size * 0.14, color: '#64748b', marginTop: 2 }}>
            Grade {getScoreGrade(score)}
          </div>
        )}
      </div>
    </div>
  );
}