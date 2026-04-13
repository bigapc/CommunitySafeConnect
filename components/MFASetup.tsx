"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MFASetupProps {
  onComplete?: () => void;
  username?: string;
}

export default function MFASetup({ onComplete, username = "command-center" }: MFASetupProps) {
  const router = useRouter();
  const [step, setStep] = useState<"initial" | "setup" | "verify" | "success">("initial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");

  const initiateMFASetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        throw new Error("Failed to initiate MFA setup");
      }

      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const verifyMFAToken = async () => {
    if (!token.trim()) {
      setError("Please enter a TOTP token");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          token: token.trim(),
          secret,
          backupCodes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }

      setStep("success");
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mfa-setup-container">
      {step === "initial" && (
        <div className="mfa-step">
          <h2>Enable Multi-Factor Authentication</h2>
          <p>
            Two-factor authentication adds an extra layer of security to your account. You'll need to enter
            a code from your authenticator app in addition to your password.
          </p>
          <button onClick={initiateMFASetup} disabled={loading} className="btn btn-primary">
            {loading ? "Setting up..." : "Start Setup"}
          </button>
        </div>
      )}

      {step === "setup" && (
        <div className="mfa-step">
          <h2>Scan QR Code</h2>
          {qrCode && (
            <div className="mfa-qr-section">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="MFA QR Code" className="qr-code-image" />
              <p className="mfa-text">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
            </div>
          )}

          {secret && (
            <div className="mfa-secret-section">
              <p className="mfa-text">If you can't scan, enter this key manually:</p>
              <div className="secret-display">
                <code>{secret}</code>
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="btn-copy"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="mfa-backup-section">
              <p className="mfa-text">
                <strong>Save your backup codes in a safe place.</strong> You can use these if you lose access to your authenticator.
              </p>
              <div className="backup-codes-list">
                {backupCodes.map((code, idx) => (
                  <code key={idx}>{code}</code>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(backupCodes.join("\n"))}
                className="btn-copy"
                title="Copy all codes"
              >
                📋 Copy All Codes
              </button>
            </div>
          )}

          <div className="mfa-input-section">
            <label htmlFor="totp-token">Enter the 6-digit code from your authenticator:</label>
            <input
              id="totp-token"
              type="text"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="input-token"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button onClick={verifyMFAToken} disabled={loading} className="btn btn-primary">
            {loading ? "Verifying..." : "Verify & Enable MFA"}
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="mfa-step success">
          <h2>✓ MFA Enabled Successfully</h2>
          <p>Two-factor authentication is now active on your account. You'll be asked for a code on future logins.</p>
          <button onClick={() => router.push("/command-center")} className="btn btn-primary">
            Back to Command Center
          </button>
        </div>
      )}

      <style jsx>{`
        .mfa-setup-container {
          max-width: 500px;
          margin: 2rem auto;
          padding: 2rem;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg-secondary);
        }

        .mfa-step {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .mfa-step h2 {
          font-size: 1.5rem;
          color: var(--color-text-primary);
          margin: 0;
        }

        .mfa-step p {
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .mfa-qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--color-bg-primary);
          border-radius: 8px;
        }

        .qr-code-image {
          width: 200px;
          height: 200px;
          border: 2px solid var(--color-border);
          padding: 1rem;
          background: white;
        }

        .mfa-text {
          text-align: center;
          font-size: 0.875rem;
        }

        .mfa-secret-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--color-bg-primary);
          border-radius: 8px;
        }

        .secret-display {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .secret-display code {
          flex: 1;
          padding: 0.5rem;
          background: var(--color-code-bg);
          border-radius: 4px;
          font-family: monospace;
          color: var(--color-code-text);
          word-break: break-all;
        }

        .btn-copy {
          padding: 0.5rem;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }

        .btn-copy:hover {
          background: var(--color-bg-hover);
        }

        .mfa-backup-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-warning-light, #fff3cd);
          border: 1px solid var(--color-warning, #ffc107);
          border-radius: 8px;
        }

        .backup-codes-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .backup-codes-list code {
          padding: 0.5rem;
          background: white;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875rem;
          text-align: center;
        }

        .mfa-input-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mfa-input-section label {
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .input-token {
          padding: 0.75rem;
          font-size: 1.5rem;
          text-align: center;
          letter-spacing: 0.2em;
          border: 2px solid var(--color-border);
          border-radius: 4px;
          font-family: monospace;
        }

        .input-token:focus {
          outline: none;
          border-color: var(--color-primary);
          background: var(--color-bg-primary);
        }

        .error-message {
          padding: 0.75rem;
          background: var(--color-error-light, #f8d7da);
          border: 1px solid var(--color-error, #dc3545);
          border-radius: 4px;
          color: var(--color-error, #dc3545);
          font-size: 0.875rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          text-align: center;
        }

        .success h2 {
          color: var(--color-success, #28a745);
        }

        @media (max-width: 600px) {
          .mfa-setup-container {
            padding: 1.5rem;
          }

          .qr-code-image {
            width: 150px;
            height: 150px;
          }

          .backup-codes-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
