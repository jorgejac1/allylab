import { PageContainer } from '../components/layout';
import { ReportsView } from '../components/reports';
import { useScans } from '../hooks';

export function ReportsPage() {
  const { scans, removeScan } = useScans();

  return (
    <PageContainer>
      <ReportsView
        scans={scans}
        onDeleteScan={removeScan}
      />
    </PageContainer>
  );
}