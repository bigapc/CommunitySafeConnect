"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    const { data } = await supabase.from("reports").select("*");
    if (data) setReports(data);
  }

  return (
    <div className="container">
      <h2>Community Reports</h2>
      {reports.map((report) => (
        <div key={report.id}>
          <p>{report.description}</p>
        </div>
      ))}
    </div>
  );
}
