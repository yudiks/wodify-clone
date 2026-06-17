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
      {comments.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No comments yet.</p>
      ) : (
        <ul className="card-glass flex flex-col gap-4 p-4">
          {comments.map((c) => {
            const isCoach = c.author.role === "COACH";
            return (
              <li key={c.id} className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={
                    isCoach
                      ? { background: "rgba(41,121,255,0.15)", color: "var(--accent-blue)" }
                      : { background: "var(--accent-green-bg)", color: "var(--accent-green)" }
                  }
                >
                  {initials(c.author.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.author.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        isCoach
                          ? { background: "rgba(41,121,255,0.1)", color: "var(--accent-blue)" }
                          : { background: "var(--accent-green-bg)", color: "var(--accent-green)" }
                      }
                    >
                      {isCoach ? "Coach" : "Athlete"}
                    </span>
                    {c.timestampSec != null && (
                      <button
                        onClick={() => seekTo(c.timestampSec!)}
                        className="rounded px-1.5 py-0.5 font-mono text-xs hover:brightness-125"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                      >
                        {formatTime(c.timestampSec)}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{c.text}</p>
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
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={tagTime}
            onChange={(e) => setTagTime(e.target.checked)}
          />
          Tag current video time
        </label>
        {error && <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="btn-glow-blue self-start rounded-lg px-4 py-2 text-sm disabled:opacity-50"
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
