import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <h1 className="navbar-brand">CommunitySafeConnect</h1>
        <div className="navbar-links">
          <Link href="/report">Report</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login">Sign In</Link>
        </div>
      </div>
    </nav>
  );
}