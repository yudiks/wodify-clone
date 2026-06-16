"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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
    const file = formData.get("video") as File;

    try {
      setProgress("Uploading video...");
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/submissions/upload",
        addRandomSuffix: true,
      });

      setProgress("Saving submission...");
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, movementType, videoUrl: blob.url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Upload failed");
        return;
      }

      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "Upload failed");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

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
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? (progress ?? "Uploading...") : "Upload"}
      </button>
    </form>
  );
}
