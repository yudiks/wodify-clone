"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import Logo from "@/components/Logo";

export default function AuthedNav({
  userName,
  role,
}: {
  userName?: string | null;
  role: "ATHLETE" | "COACH";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links =
    role === "ATHLETE"
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/upload", label: "Upload" },
        ]
      : [{ href: "/coach", label: "Coach Inbox" }];

  const sidebarContent = (
    <>
      <div className="mb-10 flex items-center justify-between">
        <Logo />
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 hover:bg-white/5 lg:hidden"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
              style={active ? { background: "rgba(41,121,255,0.12)", color: "var(--accent-blue)" } : { color: "var(--text-secondary)" }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
        <span className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
          {userName}
        </span>
        <SignOutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 lg:hidden"
        style={{ borderColor: "var(--border-color)", background: "rgba(11,12,15,0.85)" }}
      >
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 hover:bg-white/5"
          style={{ color: "var(--text-primary)" }}
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Desktop fixed sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r p-6 lg:flex"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside
            className="absolute inset-y-0 left-0 flex w-64 flex-col border-r p-6 shadow-[var(--shadow-main)]"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
