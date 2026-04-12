"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStep("otp");
      setMessage("Check the terminal for your one-time code.");
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to send code.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signed in successfully!");
    }
  };

  return (
    <div className="container">
      <h2>Sign In</h2>

      {step === "email" && (
        <form onSubmit={handleRequestOtp}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send One-Time Code</button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp}>
          <input
            type="text"
            placeholder="Enter one-time code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit">Verify Code</button>
          <button type="button" onClick={() => setStep("email")}>
            Back
          </button>
        </form>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}
