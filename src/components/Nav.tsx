import Link from "next/link";
import type { Session } from "next-auth";
import Logo from "@/components/Logo";
import AuthedNav from "@/components/AuthedNav";

export default function Nav({ session }: { session: Session | null }) {
  if (session) {
    return <AuthedNav userName={session.user.name} role={session.user.role} />;
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
