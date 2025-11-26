import { PageContainer } from '../components/layout';
import { CompetitorBenchmark } from '../components/benchmarking';
import { useLocalStorage } from '../hooks';
import type { SavedScan } from '../types';

export function BenchmarkPage() {
  const [scans] = useLocalStorage<SavedScan[]>('allylab_scans', []);
  
  // Get the most recent scan as "your site"
  const latestScan = scans.length > 0 ? scans[0] : null;

  return (
    <PageContainer
      title="Competitor Benchmarking"
      subtitle="Compare your accessibility scores against competitors"
    >
      <CompetitorBenchmark
        yourSiteUrl={latestScan?.url}
        yourSiteScore={latestScan?.score}
      />
    </PageContainer>
  );
}