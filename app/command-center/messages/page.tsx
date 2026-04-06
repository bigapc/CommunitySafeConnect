import { getCommandCenterMessages } from "@/lib/commandCenterData";

interface CommandCenterMessagesPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterMessagesPage({ searchParams }: CommandCenterMessagesPageProps) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const returnTo = `/command-center/messages${params.q ? `?q=${encodeURIComponent(params.q)}` : ""}`;

  const { messages, error } = await getCommandCenterMessages(query);

  return (
    <section>
      <form action="/command-center/messages" method="get" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search messages"
          style={{
            padding: "10px",
            minWidth: "280px",
            background: "#1e293b",
            border: "1px solid #334155",
            color: "white",
          }}
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "#fca5a5" }}>Could not load messages.</p>}

      <h3 style={{ marginTop: "1rem" }}>Messages ({messages.length})</h3>
      {messages.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No messages found.</p>
      ) : (
        messages.map((message) => (
          <article
            key={message.id}
            style={{
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              background: "#1e293b",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong style={{ color: "#00c2ff" }}>{message.username}</strong>: {message.message}
            </p>
            <small style={{ color: "#94a3b8" }}>
              {new Date(message.created_at).toLocaleString()}
            </small>
            <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <small style={{ color: message.flagged ? "#fca5a5" : "#86efac" }}>
                {message.flagged
                  ? `Flagged${message.flagged_at ? ` at ${new Date(message.flagged_at).toLocaleString()}` : ""}`
                  : "Clean"}
              </small>
              <form action={`/api/command-center/messages/${message.id}/flag`} method="post">
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="mode" value={message.flagged ? "unflag" : "flag"} />
                <button type="submit">{message.flagged ? "Unflag" : "Flag"}</button>
              </form>
            </div>
          </article>
        ))
      )}
    </section>
  );
}