"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Delete failed");
      setConfirming(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Delete this submission?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-600 hover:text-red-700 hover:underline dark:text-red-400"
    >
      Delete submission
    </button>
  );
}
