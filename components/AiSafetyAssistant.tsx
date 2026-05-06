"use client";

import { FormEvent, useState } from "react";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  "Summarize current command-center priorities.",
  "Give me a triage plan for a critical lighting outage.",
  "Draft responder instructions for a crowd control incident.",
];

export default function AiSafetyAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "AI Safety Assistant ready. Ask for triage plans, escalation guidance, debrief summaries, or stakeholder messaging.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function sendMessage(nextPrompt?: string) {
    const text = (nextPrompt || prompt).trim();
    if (!text) {
      return;
    }

    setIsSending(true);
    setErrorMessage("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setPrompt("");

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: text }),
      });

      const payload = (await response.json().catch(() => null)) as { answer?: string; error?: string } | null;

      if (!response.ok || !payload?.answer) {
        setErrorMessage(payload?.error || "Assistant request failed.");
        return;
      }

      setMessages((current) => [...current, { role: "assistant", content: payload.answer as string }]);
    } finally {
      setIsSending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  return (
    <section>
      <article className="control-card" style={{ padding: "0.85rem" }}>
        <h3 style={{ marginTop: 0 }}>AI Safety Assistant</h3>
        <p className="control-meta" style={{ marginTop: "-0.2rem" }}>
          Operational co-pilot for triage, escalation language, response plans, and debrief summaries.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
          {starterPrompts.map((entry) => (
            <button key={entry} type="button" onClick={() => void sendMessage(entry)} disabled={isSending}>
              {entry}
            </button>
          ))}
        </div>
      </article>

      <article className="control-card" style={{ marginTop: "0.8rem", padding: "0.85rem" }}>
        <div className="assistant-thread">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`assistant-bubble assistant-${message.role}`}>
              <strong>{message.role === "assistant" ? "Assistant" : "You"}</strong>
              <p style={{ margin: "0.3rem 0 0" }}>{message.content}</p>
            </article>
          ))}
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: "0.8rem" }}>
          <textarea
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask for response strategy, escalation notes, incident summaries, or action checklists"
            required
          />
          <div style={{ marginTop: "0.55rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button type="submit" disabled={isSending}>
              {isSending ? "Analyzing..." : "Ask Assistant"}
            </button>
            {errorMessage && <small style={{ color: "#ffb3bf" }}>{errorMessage}</small>}
          </div>
        </form>
      </article>
    </section>
  );
}
