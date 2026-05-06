import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero-grid">
        <div>
          <h2>Community Operations Desk</h2>
          <p>
            A resilient safety architecture designed for schools, universities, faith communities,
            and neighborhood coalitions to coordinate prevention, response, and trusted communication.
          </p>
          <p>
            Built for national-scale deployment with role-gated command workflows and institution-ready operations.
          </p>
        </div>
        <div className="hero-stack">
          <div className="hero-image-card">
            <Image
              src="/images/campus-safety.svg"
              alt="Campus and municipal safety operations visual"
              width={1200}
              height={800}
            />
          </div>
        </div>
      </section>

      <div className="mission-grid">
        <article className="mission-card">
          <h3>Resident Actions</h3>
          <p><Link href="/report">Submit a report</Link></p>
          <p><Link href="/chat">Open safety chat</Link></p>
        </article>

        <article className="mission-card">
          <h3>Organization View</h3>
          <p><Link href="/dashboard">Review dashboard</Link></p>
          <p><Link href="/access?next=/dashboard">Access portal</Link></p>
        </article>

        <article className="mission-card">
          <h3>Admin Controls</h3>
          <p><Link href="/command-center">Command Center</Link></p>
          <p><Link href="/access?next=/command-center">Admin access</Link></p>
        </article>
      </div>

      <section className="access-chooser">
        <h3>Choose Access Type</h3>
        <p>Select your portal first, then sign in with the matching access code.</p>
        <div className="access-chooser-grid">
          <Link href="/access?next=/dashboard" className="access-chooser-tile">
            <strong>Organization Portal</strong>
            <small>For report review, operations dashboard, and live coordination chat.</small>
          </Link>
          <Link href="/access?next=/command-center" className="access-chooser-tile">
            <strong>Admin Command Center</strong>
            <small>For moderation, incident command, evidence workflow, and exports.</small>
          </Link>
        </div>
      </section>

      <section className="action-hub">
        <h3>Quick Workflow Hub</h3>
        <p>Choose a mission and jump directly to the exact workflow entry point.</p>
        <div className="action-grid">
          <Link href="/access?next=/report" className="action-tile">
            <strong>Incident Intake</strong>
            <small>Authenticate and file a structured safety report.</small>
          </Link>
          <Link href="/access?next=/chat" className="action-tile">
            <strong>Live Coordination</strong>
            <small>Sign in and coordinate with field volunteers in real time.</small>
          </Link>
          <Link href="/access?next=/dashboard" className="action-tile">
            <strong>Organization Review</strong>
            <small>View recent reports and policy-limited historical windows.</small>
          </Link>
          <Link href="/access?next=/command-center/overview" className="action-tile">
            <strong>Ops Command</strong>
            <small>Open command-center overview for metrics and response posture.</small>
          </Link>
          <Link href="/access?next=/command-center/evidence" className="action-tile">
            <strong>Evidence Workflow</strong>
            <small>Request, approve, and export legal evidence packages.</small>
          </Link>
          <Link href="/access?next=/command-center/incidents" className="action-tile">
            <strong>Incident Queue</strong>
            <small>Create, triage, assign, and escalate active incidents.</small>
          </Link>
        </div>
      </section>

      <section className="sector-showcase">
        <article className="sector-card">
          <Image
            src="/images/community-response.svg"
            alt="Community response coordination"
            width={1200}
            height={800}
          />
          <h3>Institutional Preparedness</h3>
          <p>For colleges, universities, churches, and community organizations requiring reliable safety coordination.</p>
        </article>
        <article className="sector-card">
          <Image
            src="/images/command-center.svg"
            alt="Command center operational intelligence"
            width={1200}
            height={800}
          />
          <h3>Operational Intelligence</h3>
          <p>Admin teams gain route-level governance, event telemetry, and moderation visibility in one command environment.</p>
        </article>
      </section>
    </main>
  );
}
