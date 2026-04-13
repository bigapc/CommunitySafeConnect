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
      <form action="/command-center/messages" method="get" className="control-search">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search messages"
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "#ffb3bf" }}>Could not load messages.</p>}

      <h3 style={{ marginTop: "1rem" }}>Messages ({messages.length})</h3>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        <div className="control-list">
        {messages.map((message) => (
          <article key={message.id} className="control-card" style={{ padding: "0.75rem" }}>
            <p style={{ margin: 0 }}>
              <strong>{message.username}</strong>: {message.message}
            </p>
            <small className="control-meta">{new Date(message.created_at).toLocaleString()}</small>
            <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className={`status-pill ${message.flagged ? "flagged" : "clean"}`}>
                {message.flagged
                  ? `Flagged${message.flagged_at ? ` ${new Date(message.flagged_at).toLocaleString()}` : ""}`
                  : "Clean"}
              </span>
              <form action={`/api/command-center/messages/${message.id}/flag`} method="post">
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="mode" value={message.flagged ? "unflag" : "flag"} />
                <button type="submit">{message.flagged ? "Unflag" : "Flag"}</button>
              </form>
            </div>
          </article>
        ))}
        </div>
      )}
    </section>
  );
}