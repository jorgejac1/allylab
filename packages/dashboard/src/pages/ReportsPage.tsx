import { PageContainer } from '../components/layout';
import { ReportsView } from '../components/reports';
import { useScans } from '../hooks';

export function ReportsPage() {
  const { scans, removeScan, getRecentRegressions, hasRegression } = useScans();

  return (
    <PageContainer>
      <ReportsView
        scans={scans}
        onDeleteScan={removeScan}
        recentRegressions={getRecentRegressions()}
        hasRegression={hasRegression}
      />
    </PageContainer>
  );
}