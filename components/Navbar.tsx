'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all">
              🛡️
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              SafeConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/report">Report</NavLink>
            <NavLink href="/safe-zones">Safe Zones</NavLink>
            <NavLink href="/safe-walk">Safe Walk</NavLink>
            <NavLink href="/sos">SOS Alert</NavLink>
            <NavLink href="/live-map">Live Map</NavLink>
            <NavLink href="/command-center">Command Center</NavLink>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/access?next=/command-center">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/sos">
              <Button variant="danger" size="sm">🚨 SOS</Button>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-neutral-200">
            <MobileNavLink href="/report">Report</MobileNavLink>
            <MobileNavLink href="/safe-zones">Safe Zones</MobileNavLink>
            <MobileNavLink href="/safe-walk">Safe Walk</MobileNavLink>
            <MobileNavLink href="/sos">SOS Alert</MobileNavLink>
            <MobileNavLink href="/live-map">Live Map</MobileNavLink>
            <MobileNavLink href="/command-center">Command Center</MobileNavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}