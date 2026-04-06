import Link from "next/link";
import AccessSessionControls from "@/components/AccessSessionControls";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <h1 className="navbar-brand">CommunitySafeConnect</h1>
        <div className="navbar-links">
          <Link href="/report">Report</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/command-center">Command Center</Link>
        </div>
        <AccessSessionControls />
      </div>
    </nav>
  );
}