"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReportForm() {
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.from("reports").insert([
      { description }
    ]);

    if (error) {
      alert("Error submitting report");
    } else {
      alert("Report submitted securely");
      setDescription("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Describe the situation..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <button type="submit">Submit</button>
    </form>
  );
}
