"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toYouTubeEmbedUrl, extractYouTubeId } from "@/lib/youtube";

type Mode = "file" | "youtube";

export default function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const movementType = formData.get("movementType") as string;

    try {
      let videoUrl: string;

      if (mode === "youtube") {
        const embedUrl = toYouTubeEmbedUrl(youtubeUrl);
        if (!embedUrl) {
          setError("Could not recognise that YouTube URL. Paste a youtube.com or youtu.be link.");
          return;
        }
        videoUrl = embedUrl;
      } else {
        const file = formData.get("video") as File;
        setProgress("Uploading video...");
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/submissions/upload",
        });
        videoUrl = blob.url;
      }

      setProgress("Saving submission...");
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, movementType, videoUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Upload failed");
        return;
      }

      formRef.current?.reset();
      setYoutubeUrl("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "Upload failed");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  const youtubeValid = mode === "youtube" && extractYouTubeId(youtubeUrl) !== null;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="font-semibold">Upload a new video</h2>

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          name="title"
          required
          placeholder="e.g. Heavy single snatch attempt"
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Movement
        <input
          name="movementType"
          required
          placeholder="e.g. Snatch"
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </label>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded border border-zinc-200 p-1 text-sm dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex-1 rounded px-3 py-1.5 transition-colors ${
            mode === "file"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode("youtube")}
          className={`flex-1 rounded px-3 py-1.5 transition-colors ${
            mode === "youtube"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          YouTube link
        </button>
      </div>

      {mode === "file" ? (
        <label className="flex flex-col gap-1 text-sm">
          Video file
          <input
            name="video"
            type="file"
            accept="video/*"
            required
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          YouTube URL
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {youtubeUrl && !youtubeValid && (
            <span className="text-xs text-red-500">Paste a youtube.com or youtu.be link</span>
          )}
          {youtubeValid && (
            <span className="text-xs text-green-600 dark:text-green-400">✓ Valid YouTube link</span>
          )}
        </label>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || (mode === "youtube" && !youtubeValid)}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? (progress ?? "Saving...") : mode === "youtube" ? "Add video" : "Upload"}
      </button>
    </form>
  );
}
