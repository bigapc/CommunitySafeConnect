import Link from "next/link";
import { requireAdminAccess } from "@/lib/access";

export default async function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminAccess("/command-center");

  return (
    <main className="container">
      <h2>Command Center</h2>
      <p style={{ color: "#94a3b8" }}>
        Manage reports, message activity, and access logs.
      </p>
      <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/command-center/reports">Reports</Link>
        <Link href="/command-center/messages">Messages</Link>
        <Link href="/command-center/audit">Audit</Link>
      </nav>
      {children}
    </main>
  );
}