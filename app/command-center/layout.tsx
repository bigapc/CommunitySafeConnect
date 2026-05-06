import Link from "next/link";
import { requireAdminAccess } from "@/lib/access";

export default async function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminAccess("/command-center");

  return (
    <main className="container control-room">
      <h2>Command Center Ops Console</h2>
      <p>Manage reports, live message moderation, and access policy logs.</p>
      <nav className="control-room-nav">
        <Link href="/command-center/overview">Overview</Link>
        <Link href="/command-center/reports">Reports</Link>
        <Link href="/command-center/incidents">Incidents</Link>
        <Link href="/command-center/messages">Messages</Link>
        <Link href="/command-center/channels">Channels</Link>
        <Link href="/command-center/assistant">AI Assistant</Link>
        <Link href="/command-center/escalations">Escalations</Link>
        <Link href="/command-center/evidence">Evidence</Link>
        <Link href="/command-center/audit">Audit</Link>
        <Link href="/command-center/subscription">Subscription</Link>
      </nav>
      {children}
    </main>
  );
}