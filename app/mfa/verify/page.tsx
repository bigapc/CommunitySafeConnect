"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MFAVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/command-center";

  const [token, setToken] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const inputValue = useBackupCode ? backupCode : token;

      if (!inputValue.trim()) {
        throw new Error(useBackupCode ? "Please enter a backup code" : "Please enter a TOTP token");
      }

      const endpoint = useBackupCode ? "/api/mfa/backup" : "/api/mfa/verify";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          useBackupCode
            ? { backup_code: inputValue }
            : { token: inputValue }
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }

      // Redirect to next URL
      router.push(nextUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-verify-container">
      <div className="mfa-verify-card">
        <h1>Verify Your Identity</h1>
        <p className="subtitle">Two-Factor Authentication Required</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={verifyToken} className="mfa-verify-form">
          {!useBackupCode ? (
            <div className="form-group">
              <label htmlFor="totp-token">Enter TOTP Code</label>
              <input
                id="totp-token"
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="input-token"
                disabled={loading}
                autoFocus
              />
              <small>6-digit code from your authenticator app</small>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="backup-code">Enter Backup Code</label>
              <input
                id="backup-code"
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="1234-5678"
                className="input-token"
                disabled={loading}
                autoFocus
              />
              <small>One of your backup codes</small>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="toggle-section">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setError(null);
              setToken("");
              setBackupCode("");
            }}
            className="btn-toggle"
          >
            {useBackupCode ? "Use TOTP instead" : "Use backup code instead"}
          </button>
        </div>

        <div className="help-section">
          <h3>Need help?</h3>
          <ul>
            <li>Make sure your device time is synchronized</li>
            <li>Check that you're using the correct authenticator app</li>
            <li>If you've lost your codes, contact your administrator</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .mfa-verify-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          padding: 1rem;
        }

        .mfa-verify-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 2rem;
          max-width: 400px;
          width: 100%;
        }

        .mfa-verify-card h1 {
          font-size: 1.75rem;
          color: var(--color-text-primary);
          margin: 0 0 0.5rem;
        }

        .subtitle {
          color: var(--color-text-secondary);
          margin: 0 0 1.5rem;
          font-size: 0.9rem;
        }

        .mfa-verify-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: 0.95rem;
        }

        .input-token {
          padding: 0.75rem;
          font-size: 1.5rem;
          text-align: center;
          letter-spacing: 0.2em;
          border: 2px solid var(--color-border);
          border-radius: 6px;
          font-family: monospace;
          transition: border-color 0.2s;
        }

        .input-token:focus {
          outline: none;
          border-color: var(--color-primary);
          background: var(--color-bg-primary);
        }

        .input-token:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-group small {
          color: var(--color-text-secondary);
          font-size: 0.85rem;
        }

        .alert {
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .alert-error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
        }

        .btn {
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-block {
          width: 100%;
        }

        .toggle-section {
          display: flex;
          justify-content: center;
        }

        .btn-toggle {
          background: none;
          border: none;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
          padding: 0;
        }

        .btn-toggle:hover {
          color: var(--color-primary-dark);
        }

        .help-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
        }

        .help-section h3 {
          font-size: 0.95rem;
          color: var(--color-text-primary);
          margin: 0 0 0.75rem;
        }

        .help-section ul {
          margin: 0;
          padding-left: 1.2rem;
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .help-section li {
          margin-bottom: 0.5rem;
        }

        @media (max-width: 600px) {
          .mfa-verify-card {
            padding: 1.5rem;
          }

          .mfa-verify-card h1 {
            font-size: 1.5rem;
          }

          .input-token {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function MFAVerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MFAVerifyContent />
    </Suspense>
  );
}
