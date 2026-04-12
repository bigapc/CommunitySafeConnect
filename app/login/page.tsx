"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } else {
      alert("Failed to send code. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <p>Enter your email to receive a one-time code (printed to the terminal in development).</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send Code"}
        </button>
      </form>
    </div>
  );
}
