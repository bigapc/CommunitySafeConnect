"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

interface ChatClientProps {
  initialMessages: ChatMessage[];
}

export default function ChatClient({ initialMessages }: ChatClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [username, setUsername] = useState("");
  const [sessionUsername, setSessionUsername] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const response = await fetch("/api/chat/messages", {
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { messages?: ChatMessage[]; error?: string }
      | null;

    if (!response.ok) {
      setErrorMessage(payload?.error || "Could not load chat messages.");
      return;
    }

    setMessages(payload?.messages || []);
    setErrorMessage("");
  }, []);

  useEffect(() => {
    if (!sessionUsername) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchMessages();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchMessages, sessionUsername]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim()) {
      return;
    }

    setSessionUsername(username.trim());
    void fetchMessages();
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: sessionUsername,
        message,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: ChatMessage; error?: string }
      | null;

    if (!response.ok || !payload?.message) {
      setErrorMessage(payload?.error || "Error sending message.");
      return;
    }

    setMessages((currentMessages) => [...currentMessages, payload.message as ChatMessage]);
    setMessage("");
    setErrorMessage("");
  }

  if (!sessionUsername) {
    return (
      <div className="container">
        <h2>Open Chat Session</h2>
        <p>Enter a username to join the organization chat.</p>
        <form onSubmit={openSession} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            style={{
              padding: "10px",
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              color: "white",
            }}
          />
          <button type="submit">Join Chat</button>
        </form>
        {errorMessage && <p style={{ color: "#fca5a5" }}>{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Organization Chat</h2>
      <p style={{ color: "#94a3b8" }}>
        Chatting as <strong style={{ color: "#00c2ff" }}>{sessionUsername}</strong>
      </p>
      <div
        style={{
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "1rem",
          minHeight: "300px",
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: "1rem",
          background: "#1e293b",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#64748b" }}>No messages yet. Start the conversation.</p>
        )}
        {messages.map((chatMessage) => (
          <div key={chatMessage.id}>
            <span style={{ color: "#00c2ff", fontWeight: "bold" }}>{chatMessage.username}</span>
            <span style={{ color: "#94a3b8", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
              {new Date(chatMessage.created_at).toLocaleTimeString()}
            </span>
            <p style={{ margin: "0.2rem 0 0 0" }}>{chatMessage.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          style={{
            padding: "10px",
            flex: 1,
            background: "#1e293b",
            border: "1px solid #334155",
            color: "white",
          }}
        />
        <button type="submit">Send</button>
      </form>
      {errorMessage && <p style={{ color: "#fca5a5" }}>{errorMessage}</p>}
    </div>
  );
}