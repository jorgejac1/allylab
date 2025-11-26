import { ExecutiveDashboard } from '../components/executive';
import type { DrillDownTarget } from '../types';
import { PageContainer } from '../components/layout';

interface ExecutivePageProps {
  onDrillDown?: (target: DrillDownTarget) => void;
}

export function ExecutivePage({ onDrillDown }: ExecutivePageProps) {
  return (
    <PageContainer
      title="Executive Dashboard"
      subtitle="High-level accessibility overview across all monitored sites"
    >
      <ExecutiveDashboard onDrillDown={onDrillDown} />
    </PageContainer>
  );
}