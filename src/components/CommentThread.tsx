"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  text: string;
  timestampSec: number | null;
  createdAt: string;
  author: { name: string; role: "ATHLETE" | "COACH" };
};

export default function CommentThread({
  submissionId,
  comments,
  videoRef,
}: {
  submissionId: string;
  comments: Comment[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [tagTime, setTagTime] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/submissions/${submissionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        timestampSec: tagTime ? videoRef.current?.currentTime ?? null : null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post comment");
      return;
    }

    setText("");
    router.refresh();
  }

  function seekTo(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold">Comments</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {comments.map((c) => {
            const isCoach = c.author.role === "COACH";
            return (
              <li key={c.id} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCoach
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {initials(c.author.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.author.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isCoach
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {isCoach ? "Coach" : "Athlete"}
                    </span>
                    {c.timestampSec != null && (
                      <button
                        onClick={() => seekTo(c.timestampSec!)}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      >
                        {formatTime(c.timestampSec)}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{c.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={tagTime}
            onChange={(e) => setTagTime(e.target.checked)}
          />
          Tag current video time
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post comment"}
        </button>
      </form>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
