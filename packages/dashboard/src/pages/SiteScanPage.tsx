import { PageContainer } from '../components/layout';
import { SiteScanner } from '../components/scanner/SiteScanner';

export function SiteScanPage() {
  return (
    <PageContainer
      title="Site Scan"
      subtitle="Scan multiple pages across your website"
    >
      <SiteScanner />
    </PageContainer>
  );
}