"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type LogoutMode = "hard" | "policy";

export default function AccessSessionControls() {
  const router = useRouter();
  const pathname = usePathname();
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const scope = useMemo(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/command-center")) {
      return "admin";
    }

    return "organization";
  }, [pathname]);

  if (pathname === "/access") {
    return null;
  }

  async function logout(mode: LogoutMode) {
    setIsBusy(true);
    setMessage("");

    const endpoint =
      mode === "policy"
        ? `/api/access/session?retain=policy&scope=${scope}`
        : "/api/access/session";

    const response = await fetch(endpoint, {
      method: "DELETE",
    });

    if (!response.ok) {
      setMessage("Session update failed. Try again.");
      setIsBusy(false);
      return;
    }

    if (mode === "policy") {
      setMessage("Policy retention applied. Access stays active for the policy window.");
      router.refresh();
      setIsBusy(false);
      return;
    }

    router.push(`/access?next=${encodeURIComponent(pathname)}`);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <button type="button" onClick={() => void logout("hard")} disabled={isBusy}>
        Logout Now
      </button>
      <button type="button" onClick={() => void logout("policy")} disabled={isBusy}>
        Logout with Policy Retention
      </button>
      {message && <small style={{ color: "#94a3b8" }}>{message}</small>}
    </div>
  );
}