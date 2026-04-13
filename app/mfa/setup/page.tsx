"use client";

import MFASetup from "@/components/MFASetup";
import { requireAdminAccess } from "@/lib/access";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MFASetupPage() {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authorization on client side
    async function checkAuth() {
      try {
        const res = await fetch("/api/mfa/status?username=command-center");
        if (!res.ok) {
          router.push("/access");
          return;
        }
        setAuthorized(true);
      } catch (error) {
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
        <h1>Two-Factor Authentication Setup</h1>
        <p>Secure your CommunitySafeConnect account with multi-factor authentication</p>
      </div>

      <div className="page-content">
        <MFASetup onComplete={() => {}} />
      </div>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: var(--color-bg-primary);
          padding: 2rem;
        }

        .page-header {
          max-width: 800px;
          margin: 0 auto 3rem;
          text-align: center;
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

        .page-content {
          max-width: 600px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .admin-page {
            padding: 1rem;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
