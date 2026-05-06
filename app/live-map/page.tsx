import Link from "next/link";
import { requireOrganizationAccess } from "@/lib/access";
import LiveMapPanel from "@/components/LiveMapPanel";

export default async function LiveMapPage() {
  await requireOrganizationAccess("/live-map");

  return (
    <main className="container">
      <h2>Live Map Intelligence</h2>
      <p style={{ color: "#94a3b8", marginTop: "-0.2rem" }}>
        Geospatial operating view for safe zones, active incidents, and patrol positioning.
      </p>

      <LiveMapPanel />

      <div className="org-quick-actions" style={{ marginTop: "1rem" }}>
        <Link href="/safe-zones">Safe Zones</Link>
        <Link href="/incident-log">Incident Log</Link>
        <Link href="/command-center/overview">Command Center Overview</Link>
      </div>
    </main>
  );
}
