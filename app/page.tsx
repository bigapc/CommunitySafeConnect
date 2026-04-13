import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <h2>Community Operations Desk</h2>
      <p>
        A practical workspace for residents and organizers to submit concerns, track updates,
        and coordinate responses.
      </p>
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <article style={{ margin: 0, padding: "0.85rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Resident Actions</h3>
          <p style={{ marginTop: 0 }}><Link href="/report">Submit a report</Link></p>
          <p style={{ marginTop: 0 }}><Link href="/chat">Open safety chat</Link></p>
        </article>
        <article style={{ margin: 0, padding: "0.85rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Organization View</h3>
          <p style={{ marginTop: 0 }}><Link href="/dashboard">Review dashboard</Link></p>
          <p style={{ marginTop: 0 }}><Link href="/access?next=/dashboard">Access portal</Link></p>
        </article>
        <article style={{ margin: 0, padding: "0.85rem" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Admin Controls</h3>
          <p style={{ marginTop: 0 }}><Link href="/command-center">Command Center</Link></p>
          <p style={{ marginTop: 0 }}><Link href="/access?next=/command-center">Admin access</Link></p>
        </article>
      </div>
    </main>
  );
}
