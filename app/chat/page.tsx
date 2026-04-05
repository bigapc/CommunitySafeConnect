"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState("");
  const [sessionUsername, setSessionUsername] = useState("");
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionUsername) return;

    fetchMessages();

    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionUsername]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  }

  function openSession(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim()) {
      setSessionUsername(username.trim());
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    const { error } = await supabase
      .from("chat_messages")
      .insert([{ username: sessionUsername, message: message.trim() }]);

    if (error) {
      alert("Error sending message");
    } else {
      setMessage("");
    }
  }

  if (!sessionUsername) {
    return (
      <div className="container">
        <h2>Open Chat Session</h2>
        <p>Enter a username to join the community chat.</p>
        <form onSubmit={openSession} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Community Chat</h2>
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
          <p style={{ color: "#64748b" }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            <span style={{ color: "#00c2ff", fontWeight: "bold" }}>
              {msg.username}
            </span>
            <span style={{ color: "#94a3b8", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
              {new Date(msg.created_at).toLocaleTimeString()}
            </span>
            <p style={{ margin: "0.2rem 0 0 0" }}>{msg.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
    </div>
  );
}
