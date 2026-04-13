"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/access/session?check=admin");
        if (!res.ok) {
          router.push("/access");
          return;
        }
        setAuthorized(true);
      } catch {
        router.push("/access");
      }
    }

    checkAuth();
  }, [router]);

  if (!authorized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Security & Compliance</h1>
        <p>CommunitySafeConnect Enterprise Security Features</p>
      </div>

      <div className="security-content">
        <section className="security-section">
          <h2>🔐 Authentication & Authorization</h2>

          <article className="feature-card">
            <h3>Multi-Factor Authentication (MFA)</h3>
            <p>
              <strong>Status:</strong> ✅ Enabled
            </p>
            <p>
              Time-based One-Time Passwords (TOTP) for enhanced account security. Backup codes
              available for account recovery.
            </p>
            <ul>
              <li>TOTP-based MFA with 30-second time windows</li>
              <li>Backup codes for account recovery</li>
              <li>Per-user MFA configuration</li>
              <li>Timing-safe token verification</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Role-Based Access Control (RBAC)</h3>
            <p>
              <strong>Status:</strong> ✅ Implemented
            </p>
            <p>Granular permission system with three privilege levels.</p>
            <ul>
              <li>
                <strong>User Role:</strong> Create reports, send messages
              </li>
              <li>
                <strong>Operator Role:</strong> Access command center, moderate content
              </li>
              <li>
                <strong>Admin Role:</strong> Full system access, user management
              </li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Secure Session Management</h3>
            <p>
              <strong>Status:</strong> ✅ Enabled
            </p>
            <p>Cryptographically signed cookies with automatic expiration.</p>
            <ul>
              <li>HMAC-SHA256 signature verification</li>
              <li>HttpOnly cookies (XSS protection)</li>
              <li>SameSite=Lax (CSRF protection)</li>
              <li>Configurable session timeout (default: 8 hours)</li>
              <li>Timing-safe comparison prevents timing attacks</li>
            </ul>
          </article>
        </section>

        <section className="security-section">
          <h2>🔒 Data Protection</h2>

          <article className="feature-card">
            <h3>Encryption at Rest</h3>
            <p>
              <strong>Status:</strong> ✅ Available
            </p>
            <p>AES-256 encryption for sensitive data fields.</p>
            <ul>
              <li>Report descriptions encrypted</li>
              <li>Audit logs encrypted (IP, user agent, paths)</li>
              <li>MFA secrets encrypted</li>
              <li>Configurable per-field encryption</li>
              <li>Transparent encryption/decryption layer</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Audit Logging</h3>
            <p>
              <strong>Status:</strong> ✅ Enabled
            </p>
            <p>Immutable audit trail of all administrative actions.</p>
            <ul>
              <li>All session creation/deletion logged</li>
              <li>IP address and User-Agent recorded</li>
              <li>Configurable retention policies</li>
              <li>Sortable and filterable audit trail</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Data Classification</h3>
            <p>
              <strong>Status:</strong> ✅ Structured
            </p>
            <p>Sensitive data types clearly marked for protection.</p>
            <ul>
              <li>MFA secrets marked as encrypted</li>
              <li>System audit logs retained separately</li>
              <li>Granular access to encrypted fields by role</li>
            </ul>
          </article>
        </section>

        <section className="security-section">
          <h2>🛡️ Network & Transport Security</h2>

          <article className="feature-card">
            <h3>TLS/HTTPS</h3>
            <p>
              <strong>Status:</strong> ✅ Enforced in Production
            </p>
            <p>All data in transit encrypted with TLS 1.3.</p>
            <ul>
              <li>Secure HTTP headers configured</li>
              <li>Cookie secure flag set in production</li>
              <li>Enforced in Next.js middleware</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>API Security</h3>
            <p>
              <strong>Status:</strong> ✅ Enhanced
            </p>
            <p>All endpoints enforce permission checks.</p>
            <ul>
              <li>Per-endpoint permission verification</li>
              <li>Role-based request filtering</li>
              <li>Error limiting (no data leakage)</li>
            </ul>
          </article>
        </section>

        <section className="security-section">
          <h2>📋 Compliance Ready</h2>

          <article className="feature-card">
            <h3>GDPR Compliance</h3>
            <p>Data protection features aligned with GDPR requirements.</p>
            <ul>
              <li>Encryption at rest</li>
              <li>Audit trail for data access</li>
              <li>Data retention policies</li>
              <li>User authorization controls</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>HIPAA Readiness (if applicable)</h3>
            <p>Infrastructure support for HIPAA compliance.</p>
            <ul>
              <li>Access controls with MFA</li>
              <li>Encryption of data at rest and in transit</li>
              <li>Comprehensive audit logging</li>
              <li>Role-based access to PHI</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>SOC 2 Readiness</h3>
            <p>Security controls aligned with SOC 2 Trust Service Criteria.</p>
            <ul>
              <li>Authentication and authorization controls</li>
              <li>Access management (RBAC)</li>
              <li>Change tracking (audit logs)</li>
              <li>Logical separation of concerns</li>
            </ul>
          </article>
        </section>

        <section className="security-section">
          <h2>🚀 Future Security Roadmap</h2>

          <article className="feature-card">
            <h3>Short Term (1-3 months)</h3>
            <ul>
              <li>OAuth 2.0 / OIDC integration</li>
              <li>Rate limiting and DDoS protection</li>
              <li>Request signing for API calls</li>
              <li>Secrets management integration</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Medium Term (3-6 months)</h3>
            <ul>
              <li>SAML 2.0 enterprise SSO</li>
              <li>WebAuthn/FIDO2 support</li>
              <li>Multi-region deployment with TDE</li>
              <li>Real-time threat monitoring</li>
            </ul>
          </article>

          <article className="feature-card">
            <h3>Long Term (6+ months)</h3>
            <ul>
              <li>Zero-trust architecture</li>
              <li>Hardware security module (HSM) integration</li>
              <li>Formal security certification (SOC 2 Type II)</li>
              <li>Quantum-resistant encryption readiness</li>
            </ul>
          </article>
        </section>

        <section className="security-section security-contact">
          <h2>🔔 Security Issues</h2>
          <p>
            If you discover a security vulnerability, please email{" "}
            <code>security@communitysafeconnect.local</code> instead of using the issue tracker.
          </p>
          <p>
            <strong>Do not disclose the vulnerability publicly until we have had a chance to address it.</strong>
          </p>
        </section>
      </div>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: var(--color-bg-primary);
          padding: 2rem;
        }

        .page-header {
          max-width: 1000px;
          margin: 0 auto 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          color: var(--color-text-primary);
          margin: 0 0 0.5rem;
        }

        .page-header p {
          color: var(--color-text-secondary);
          margin: 0;
          font-size: 1.1rem;
        }

        .security-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        .security-section {
          margin-bottom: 3rem;
        }

        .security-section h2 {
          font-size: 1.5rem;
          color: var(--color-primary);
          margin: 0 0 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--color-border);
        }

        .feature-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border-left: 4px solid var(--color-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .feature-card h3 {
          font-size: 1.1rem;
          color: var(--color-text-primary);
          margin: 0 0 0.5rem;
        }

        .feature-card p {
          color: var(--color-text-secondary);
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        .feature-card ul {
          margin: 1rem 0 0;
          padding-left: 1.5rem;
        }

        .feature-card li {
          color: var(--color-text-secondary);
          margin: 0.5rem 0;
          line-height: 1.6;
        }

        code {
          background: var(--color-code-bg);
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
          color: var(--color-code-text);
        }

        .security-contact {
          background: var(--color-warning-light, #fff9e6);
          border: 1px solid var(--color-warning, #ffc107);
          border-left: 4px solid var(--color-warning);
        }

        .security-contact h2 {
          border-color: var(--color-warning);
          color: var(--color-warning);
        }

        @media (max-width: 768px) {
          .admin-page {
            padding: 1rem;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }

          .security-section h2 {
            font-size: 1.25rem;
          }

          .feature-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
