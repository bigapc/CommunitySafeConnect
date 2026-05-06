"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CommandChannelKind, CommandChannelMessageRow, CommandChannelRow } from "@/lib/localDataStore";

type PriorityLevel = "normal" | "high" | "critical";

interface CommandChannelsConsoleProps {
  initialChannels: CommandChannelRow[];
  initialChannelMessagesById: Record<string, CommandChannelMessageRow[]>;
  initialQuery: string;
}

const channelKinds: CommandChannelKind[] = ["alerts", "tasks", "emergency", "debrief", "drill"];
const priorityLevels: PriorityLevel[] = ["normal", "high", "critical"];

function sortByLatestMessage(channels: CommandChannelRow[]) {
  return [...channels].sort((a, b) => {
    const aTime = new Date(a.last_message_at || a.created_at).getTime();
    const bTime = new Date(b.last_message_at || b.created_at).getTime();
    return bTime - aTime;
  });
}

export default function CommandChannelsConsole({
  initialChannels,
  initialChannelMessagesById,
  initialQuery,
}: CommandChannelsConsoleProps) {
  const [channels, setChannels] = useState<CommandChannelRow[]>(sortByLatestMessage(initialChannels));
  const [channelMessagesById, setChannelMessagesById] = useState<Record<string, CommandChannelMessageRow[]>>(
    initialChannelMessagesById
  );
  const [query, setQuery] = useState(initialQuery);

  const [channelName, setChannelName] = useState("");
  const [channelKind, setChannelKind] = useState<CommandChannelKind>("alerts");
  const [isEmergency, setIsEmergency] = useState(false);

  const [activeChannelId, setActiveChannelId] = useState<string>(initialChannels[0]?.id || "");
  const [sender, setSender] = useState("ops-lead");
  const [messageBody, setMessageBody] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("normal");

  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredChannels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return channels;
    }

    return channels.filter((channel) => {
      return (
        channel.name.toLowerCase().includes(normalizedQuery) ||
        channel.kind.toLowerCase().includes(normalizedQuery) ||
        channel.created_by.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [channels, query]);

  async function refreshChannels() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/command-center/channels", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | {
            channels?: CommandChannelRow[];
            channelMessagesById?: Record<string, CommandChannelMessageRow[]>;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.channels || !payload.channelMessagesById) {
        setErrorMessage(payload?.error || "Could not refresh command channels.");
        return;
      }

      const sorted = sortByLatestMessage(payload.channels);
      setChannels(sorted);
      setChannelMessagesById(payload.channelMessagesById);
      if (!activeChannelId && sorted.length > 0) {
        setActiveChannelId(sorted[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!channelName.trim()) {
      setErrorMessage("Channel name is required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/command-center/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: channelName.trim(),
          kind: channelKind,
          isEmergency,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { channel?: CommandChannelRow; error?: string } | null;

      if (!response.ok || !payload?.channel) {
        setErrorMessage(payload?.error || "Unable to create channel.");
        return;
      }

      setChannelName("");
      setChannelKind("alerts");
      setIsEmergency(false);
      await refreshChannels();
      setActiveChannelId(payload.channel.id);
    } finally {
      setIsLoading(false);
    }
  }

  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeChannelId) {
      setErrorMessage("Select a channel first.");
      return;
    }

    if (!sender.trim() || !messageBody.trim()) {
      setErrorMessage("Sender and message are required.");
      return;
    }

    setIsPosting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/command-center/channels/${activeChannelId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sender.trim(),
          body: messageBody.trim(),
          priority,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: CommandChannelMessageRow; error?: string }
        | null;

      if (!response.ok || !payload?.message) {
        setErrorMessage(payload?.error || "Unable to post channel update.");
        return;
      }

      setMessageBody("");
      await refreshChannels();
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <section>
      <form className="control-search" onSubmit={(event) => event.preventDefault()}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search channels"
          aria-label="Search channels"
        />
      </form>

      <form onSubmit={createChannel} className="control-card channel-create-form" style={{ marginTop: "0.8rem" }}>
        <h3 style={{ marginTop: 0 }}>Create Command Channel</h3>
        <div className="incident-grid">
          <input
            type="text"
            value={channelName}
            onChange={(event) => setChannelName(event.target.value)}
            placeholder="Channel name"
            required
          />
          <select value={channelKind} onChange={(event) => setChannelKind(event.target.value as CommandChannelKind)}>
            {channelKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <label className="incident-checkbox">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(event) => setIsEmergency(event.target.checked)}
            />
            Emergency channel
          </label>
        </div>
        <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={isLoading || isPosting}>
            {isLoading ? "Creating..." : "Create Channel"}
          </button>
          <button type="button" onClick={() => void refreshChannels()} disabled={isLoading || isPosting}>
            Refresh
          </button>
        </div>
      </form>

      {errorMessage && <p style={{ color: "#ffb3bf" }}>{errorMessage}</p>}

      <h3 style={{ marginTop: "1rem" }}>Channels ({filteredChannels.length})</h3>
      <div className="control-list">
        {filteredChannels.map((channel) => {
          const isActive = activeChannelId === channel.id;
          const messages = channelMessagesById[channel.id] || [];

          return (
            <article
              key={channel.id}
              className="control-card channel-card"
              style={isActive ? { borderLeft: "3px solid #63a4ff" } : undefined}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                <p style={{ margin: 0 }}>
                  <strong>{channel.name}</strong>
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span className={`status-pill ${channel.is_emergency ? "flagged" : "clean"}`}>
                    {channel.is_emergency ? "Emergency" : "Standard"}
                  </span>
                  <span className="status-pill pending">{channel.kind}</span>
                </div>
              </div>
              <small className="control-meta" style={{ display: "block" }}>
                createdBy={channel.created_by} | last={new Date(channel.last_message_at || channel.created_at).toLocaleString()}
              </small>

              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setActiveChannelId(channel.id)}>
                  {isActive ? "Selected" : "Select"}
                </button>
              </div>

              {isActive && (
                <>
                  <form onSubmit={postMessage} className="channel-post-form">
                    <div className="incident-grid">
                      <input
                        type="text"
                        value={sender}
                        onChange={(event) => setSender(event.target.value)}
                        placeholder="Sender handle"
                        required
                      />
                      <select value={priority} onChange={(event) => setPriority(event.target.value as PriorityLevel)}>
                        {priorityLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={messageBody}
                      onChange={(event) => setMessageBody(event.target.value)}
                      placeholder="Post an internal operations update"
                      required
                    />
                    <button type="submit" disabled={isPosting || isLoading}>
                      {isPosting ? "Posting..." : "Post Update"}
                    </button>
                  </form>

                  <div className="incident-history">
                    <small className="control-meta" style={{ display: "block" }}>Recent channel activity</small>
                    {messages.length === 0 ? (
                      <small className="control-meta">No channel messages yet.</small>
                    ) : (
                      <ul>
                        {messages.map((message) => (
                          <li key={message.id}>
                            <strong>{message.sender}</strong>
                            <span className={`status-pill ${message.priority === "critical" ? "flagged" : message.priority === "high" ? "pending" : "clean"}`} style={{ marginLeft: "0.45rem" }}>
                              {message.priority}
                            </span>
                            <small className="control-meta" style={{ display: "block" }}>
                              {new Date(message.created_at).toLocaleString()}
                            </small>
                            <small className="control-meta" style={{ display: "block" }}>{message.body}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
