import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui';
import type { RegressionInfo } from '../../hooks/useScans';
import { formatDate } from '../../utils/scoreUtils';

interface RegressionAlertBannerProps {
  regressions: RegressionInfo[];
}

export function RegressionAlertBanner({ regressions }: RegressionAlertBannerProps) {
  return (
    <Card className="bg-amber-100 border border-amber-500 p-4">
      <div className="flex items-start gap-3">
        <span className="flex items-center text-amber-500">
          <AlertTriangle size={24} />
        </span>
        <div className="flex-1">
          <h4 className="m-0 mb-2 text-sm font-semibold text-amber-800">
            Score Regression Detected
          </h4>
          <div className="flex flex-col gap-1.5">
            {regressions.slice(0, 3).map((regression) => (
              <div
                key={regression.scanId}
                className="flex items-center gap-2 text-sm text-amber-900"
              >
                <span className="font-medium">{regression.url}</span>
                <span>dropped</span>
                <span className="font-bold text-red-600">
                  {regression.scoreDrop} points
                </span>
                <span className="text-amber-800">
                  ({regression.previousScore} → {regression.currentScore})
                </span>
                <span className="text-amber-700 text-xs">
                  • {formatDate(regression.timestamp)}
                </span>
              </div>
            ))}
            {regressions.length > 3 && (
              <div className="text-xs text-amber-700">
                +{regressions.length - 3} more regressions
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
