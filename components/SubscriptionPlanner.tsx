"use client";

import { useState } from "react";
import type { BillingPlanCode, BillingPlanProfile } from "@/lib/tenancy";

interface SubscriptionPlannerProps {
  billingPlans: BillingPlanProfile[];
  currentBillingPlan: BillingPlanCode;
}

const planStyles: Record<BillingPlanCode, string> = {
  basic: "pending",
  premium: "clean",
  elite: "reviewed",
};

interface PreviewPayload {
  invoice?: {
    amount_usd: number;
  };
  plan?: {
    label: string;
  };
  formula?: {
    base: number;
    reportUnitUsd: number;
    messageUnitUsd: number;
  };
  usage?: {
    reports: number;
    messages: number;
  };
  error?: string;
}

export default function SubscriptionPlanner({ billingPlans, currentBillingPlan }: SubscriptionPlannerProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestReason, setRequestReason] = useState("");

  async function generatePreview(plan: BillingPlanCode) {
    setIsLoading(plan);
    setPreviewMessage("");

    try {
      const response = await fetch("/api/command-center/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const payload = (await response.json().catch(() => null)) as PreviewPayload | null;

      if (!response.ok) {
        setPreviewMessage(payload?.error || "Unable to generate invoice preview.");
        return;
      }

      if (!payload?.invoice || !payload.plan || !payload.formula || !payload.usage) {
        setPreviewMessage("Preview generated, but response was incomplete.");
        return;
      }

      setPreviewMessage(
        `${payload.plan.label} preview: $${payload.invoice.amount_usd} ` +
          `(base $${payload.formula.base} + reports ${payload.usage.reports} x $${payload.formula.reportUnitUsd.toFixed(2)} + messages ${payload.usage.messages} x $${payload.formula.messageUnitUsd.toFixed(2)}).`
      );
    } finally {
      setIsLoading(null);
    }
  }

  async function requestPlanChange(toPlan: BillingPlanCode) {
    setIsLoading(`request-${toPlan}`);
    setRequestMessage("");

    try {
      const response = await fetch("/api/command-center/subscription/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toPlan,
          reason: requestReason.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setRequestMessage(payload?.error || "Unable to submit plan change request.");
        return;
      }

      setRequestMessage(`Plan change request submitted for ${toPlan.toUpperCase()} tier.`);
      setRequestReason("");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <>
      <h3 style={{ marginTop: "1rem" }}>Billing Tiers</h3>
      <div className="ops-metrics-grid">
        {billingPlans.map((plan) => (
          <article key={plan.code} className="control-card ops-metric-card" style={{ padding: "0.75rem" }}>
            <small className="control-meta">{plan.label} plan</small>
            <strong>${plan.monthlyBaseUsd}</strong>
            <small className="control-meta">
              Reports ${plan.reportUnitUsd.toFixed(2)} each | Messages ${plan.messageUnitUsd.toFixed(2)} each
            </small>
            <small className="control-meta" style={{ display: "block" }}>
              Includes: {plan.includes.join(" | ")}
            </small>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className={`status-pill ${planStyles[plan.code]}`}>
                {currentBillingPlan === plan.code ? "Current mapped tier" : "Available"}
              </span>
              <button
                type="button"
                onClick={() => void generatePreview(plan.code)}
                disabled={isLoading !== null}
              >
                {isLoading === plan.code ? "Generating..." : `Generate ${plan.label} Preview`}
              </button>
              {currentBillingPlan !== plan.code && (
                <button
                  type="button"
                  onClick={() => void requestPlanChange(plan.code)}
                  disabled={isLoading !== null}
                >
                  {isLoading === `request-${plan.code}` ? "Submitting..." : `Request ${plan.label}`}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <label style={{ display: "grid", gap: "0.35rem", marginTop: "0.7rem", maxWidth: "700px" }}>
        <small className="control-meta">Plan change reason (optional)</small>
        <input
          type="text"
          value={requestReason}
          onChange={(event) => setRequestReason(event.target.value)}
          placeholder="Reason for upgrade or downgrade request"
        />
      </label>
      {previewMessage && <p className="control-meta" style={{ marginTop: "0.7rem" }}>{previewMessage}</p>}
      {requestMessage && <p className="control-meta" style={{ marginTop: "0.3rem" }}>{requestMessage}</p>}
    </>
  );
}
