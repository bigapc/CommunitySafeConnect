import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="container">
      {/* ── Hero ── */}
      <section className="csc-hero">
        <div className="csc-hero-eyebrow">Powered by Armstrong Pack Company</div>
        <h2 className="csc-hero-headline">
          Safety Infrastructure for Communities,<br />Campuses, and Businesses
        </h2>
        <p className="csc-hero-sub">
          CommunitySafetyConnect provides real-time alerting, trusted response coordination,
          incident documentation, and safe location visibility in one connected platform.
        </p>
        <div className="csc-hero-actions">
          <Link href="/report" className="csc-btn csc-btn-primary">Activate SOS</Link>
          <Link href="/dashboard" className="csc-btn csc-btn-secondary">View Safe Zones</Link>
          <Link href="/access?next=/command-center" className="csc-btn csc-btn-outline">For Organizations</Link>
        </div>
      </section>

      {/* ── Platform definition ── */}
      <section className="csc-definition">
        <p className="csc-definition-text">
          CommunitySafetyConnect is a real-time safety infrastructure platform that connects
          individuals, organizations, and communities through emergency activation, trusted alerting,
          safe location awareness, and documented incident response.
        </p>
      </section>

      {/* ── Three lanes ── */}
      <section className="csc-lanes">
        <h3 className="csc-section-label">Three lanes of growth</h3>
        <div className="csc-lanes-grid">
          <article className="csc-lane-card csc-lane-consumer">
            <span className="csc-lane-icon">👤</span>
            <strong>Consumer Layer</strong>
            <p>People use SOS, Safety Circle, Safe Zones, and incident logging to stay safe and connected.</p>
          </article>
          <article className="csc-lane-card csc-lane-community">
            <span className="csc-lane-icon">🏘️</span>
            <strong>Community Layer</strong>
            <p>Neighborhood groups, churches, apartments, and local organizations use shared safety tools.</p>
          </article>
          <article className="csc-lane-card csc-lane-institution">
            <span className="csc-lane-icon">🏛️</span>
            <strong>Institution Layer</strong>
            <p>Schools, campuses, and businesses use dashboards, alert systems, response workflows, and reporting. That is where scale lives.</p>
          </article>
        </div>
      </section>

      {/* ── MVP five parts ── */}
      <section className="csc-mvp">
        <h3 className="csc-section-label">Five strong parts — Version 1</h3>
        <div className="csc-mvp-grid">
          <article className="csc-mvp-card">
            <div className="csc-mvp-number">01</div>
            <strong>Emergency Activation</strong>
            <p>Large SOS button with silent mode, live location, and alert sending.</p>
            <Link href="/report" className="csc-mvp-link">Open →</Link>
          </article>
          <article className="csc-mvp-card">
            <div className="csc-mvp-number">02</div>
            <strong>Safety Circle</strong>
            <p>Trusted contacts receive alerts, check-ins, and live status when it matters.</p>
            <Link href="/chat" className="csc-mvp-link">Open →</Link>
          </article>
          <article className="csc-mvp-card">
            <div className="csc-mvp-number">03</div>
            <strong>Safe Zones</strong>
            <p>Map of verified safe locations — schools, businesses, churches, and partner sites.</p>
            <Link href="/dashboard" className="csc-mvp-link">Open →</Link>
          </article>
          <article className="csc-mvp-card">
            <div className="csc-mvp-number">04</div>
            <strong>Incident Log</strong>
            <p>Timestamped reports with notes, photos, audio, and location for documentation.</p>
            <Link href="/report" className="csc-mvp-link">Open →</Link>
          </article>
          <article className="csc-mvp-card csc-mvp-card-wide">
            <div className="csc-mvp-number">05</div>
            <strong>Institution Dashboard</strong>
            <p>Admin-only backend for neighborhoods, campuses, and businesses to monitor alerts, approved locations, and activity in real time.</p>
            <Link href="/access?next=/command-center" className="csc-mvp-link">Access Dashboard →</Link>
          </article>
        </div>
      </section>

      {/* ── Target market ── */}
      <section className="csc-market">
        <h3 className="csc-section-label">Built for your first buyers</h3>
        <p className="csc-market-sub">Organizations with real safety needs, clear leadership, and budget.</p>
        <div className="csc-market-grid">
          {["Private & Charter Schools","Apartment Communities","Churches & Faith Networks","Small Business Campuses","Community Organizations","Higher Education"].map((name) => (
            <span key={name} className="csc-market-tag">{name}</span>
          ))}
        </div>
      </section>

      {/* ── Portal access ── */}
      <section className="access-chooser">
        <h3>Access Your Portal</h3>
        <p>Select the portal that matches your role, then sign in with your access code.</p>
        <div className="access-chooser-grid">
          <Link href="/access?next=/dashboard" className="access-chooser-tile">
            <strong>Organization Portal</strong>
            <small>Dashboard, report review, coordination chat, and safe zone management.</small>
          </Link>
          <Link href="/access?next=/command-center" className="access-chooser-tile">
            <strong>Institution Command Center</strong>
            <small>Alert monitoring, incident command, evidence workflow, and response exports.</small>
          </Link>
        </div>
      </section>

      {/* ── Footer note ── */}
      <footer className="csc-footer">
        <p>CommunitySafetyConnect &mdash; Premium Plan Platform &mdash; Powered by Armstrong Pack Company</p>
      </footer>
    </main>
  );
}
