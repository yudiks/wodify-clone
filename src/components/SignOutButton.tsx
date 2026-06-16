"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-zinc-600 hover:text-zinc-900 hover:underline"
    >
      Sign out
    </button>
  );
}
