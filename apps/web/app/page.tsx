import { AccessHubLayout } from '../components/access/AccessHubLayout';
import { InstitutionalFooter } from '../components/access/InstitutionalFooter';
import { InstitutionalHeader } from '../components/access/InstitutionalHeader';

export default function MainAccessGatewayPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-slate-100">
      {/* Architecture note: ambient layers keep the gateway visually aligned with dashboard depth. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(72,96,140,0.22)_0%,_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(56,89,74,0.18)_0%,_transparent_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-[min(1180px,92vw)] flex-col gap-6 py-6 md:py-8">
        <InstitutionalHeader />
        <AccessHubLayout />
        <InstitutionalFooter />
      </div>
    </div>
  );
}
