import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <h2>Welcome to CommunitySafeConnect</h2>
      <p>Report safety concerns and review community-submitted updates.</p>
      <p>
        <Link href="/report">Submit a report</Link>
        {" | "}
        <Link href="/dashboard">View dashboard</Link>
      </p>
    </main>
  );
}
