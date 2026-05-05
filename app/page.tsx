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
