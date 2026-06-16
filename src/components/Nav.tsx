import Link from "next/link";
import type { Session } from "next-auth";
import SignOutButton from "@/components/SignOutButton";

export default function Nav({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          FormCheck
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              {session.user.role === "ATHLETE" && (
                <Link href="/dashboard" className="hover:underline">
                  My Submissions
                </Link>
              )}
              {session.user.role === "COACH" && (
                <Link href="/coach" className="hover:underline">
                  Coach Inbox
                </Link>
              )}
              <span className="text-zinc-500">
                {session.user.name} ({session.user.role})
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
