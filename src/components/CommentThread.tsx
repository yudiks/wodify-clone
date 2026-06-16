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
        <p className="text-sm text-zinc-500">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded border border-zinc-200 bg-white p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500">
                <span className="font-medium text-zinc-700">{c.author.name}</span>
                <span>· {c.author.role}</span>
                {c.timestampSec != null && (
                  <button
                    onClick={() => seekTo(c.timestampSec!)}
                    className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono hover:bg-zinc-200"
                  >
                    {formatTime(c.timestampSec)}
                  </button>
                )}
              </div>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={tagTime}
            onChange={(e) => setTagTime(e.target.checked)}
          />
          Tag current video time
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="self-start rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post comment"}
        </button>
      </form>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
