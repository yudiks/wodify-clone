import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect(session.user.role === "COACH" ? "/coach" : "/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Get coached on every rep
      </h1>
      <p className="max-w-xl text-lg text-zinc-600">
        Record a movement on your phone, upload it, and get frame-by-frame
        feedback from your coach — drawings, notes, and timestamped comments
        right on your video.
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded border border-zinc-300 px-5 py-2.5 hover:bg-zinc-100"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
