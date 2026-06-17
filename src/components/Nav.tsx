import Link from "next/link";
import type { Session } from "next-auth";
import SignOutButton from "@/components/SignOutButton";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        FC
      </span>
      <span
        className="text-lg font-bold tracking-tight"
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        Form<span className="brand-gradient-text">Coach</span>
      </span>
    </Link>
  );
}

export default function Nav({ session }: { session: Session | null }) {
  if (session) {
    const links =
      session.user.role === "ATHLETE"
        ? [{ href: "/dashboard", label: "My Submissions" }]
        : [{ href: "/coach", label: "Coach Inbox" }];

    return (
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r p-6 lg:flex"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        <div className="mb-10">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
          <span className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {session.user.name}
          </span>
          <SignOutButton />
        </div>
      </aside>
    );
  }

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{ borderColor: "var(--border-color)", background: "rgba(11,12,15,0.85)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo />

        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="btn-glow-blue rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
