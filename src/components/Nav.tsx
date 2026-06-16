import Link from "next/link";
import type { Session } from "next-auth";
import SignOutButton from "@/components/SignOutButton";

export default function Nav({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          FormCheck
        </Link>
        <nav className="flex items-center gap-3 text-sm">
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
              <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
                {session.user.name}
                <span className="hidden md:inline"> ({session.user.role})</span>
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
                className="rounded bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
