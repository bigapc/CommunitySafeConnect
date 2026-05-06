"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SosActivationPanelProps {
  standardHref: string;
  silentHref: string;
}

type ActivationState = "idle" | "sending_standard" | "sending_silent";

export default function SosActivationPanel({ standardHref, silentHref }: SosActivationPanelProps) {
  const router = useRouter();
  const [activationState, setActivationState] = useState<ActivationState>("idle");

  const isBusy = activationState !== "idle";

  const statusCopy = {
    idle: {
      title: "Calm, fast activation",
      body: "We’ve got you. Choose standard or silent activation and we’ll move you into the response flow.",
    },
    sending_standard: {
      title: "Alert sent. Stay where you are if safe.",
      body: "Your response flow is opening now so you can notify your circle and document what happened.",
    },
    sending_silent: {
      title: "Silent alert sent. Keep your movements calm.",
      body: "Your response flow is opening quietly so you can check in without drawing attention.",
    },
  }[activationState];

  function activate(targetHref: string, mode: ActivationState) {
    setActivationState(mode);
    window.setTimeout(() => {
      router.push(targetHref);
    }, 650);
  }

  return (
    <section className="sos-activation-panel">
      <div className="sos-activation-copy">
        <p className="sos-status-kicker">Emergency Activation</p>
        <h3>{statusCopy.title}</h3>
        <p>{statusCopy.body}</p>
      </div>
      <div className="sos-activation-actions">
        <button
          type="button"
          className={`sos-primary-button ${activationState === "sending_standard" ? "active" : ""}`}
          onClick={() => activate(standardHref, "sending_standard")}
          disabled={isBusy}
        >
          {activationState === "sending_standard" ? "Sending alert..." : "Activate SOS"}
        </button>
        <button
          type="button"
          className={`sos-secondary-button ${activationState === "sending_silent" ? "active" : ""}`}
          onClick={() => activate(silentHref, "sending_silent")}
          disabled={isBusy}
        >
          {activationState === "sending_silent" ? "Opening silent mode..." : "Use Silent Mode"}
        </button>
      </div>
    </section>
  );
}
