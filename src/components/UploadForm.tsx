"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toYouTubeEmbedUrl, extractYouTubeId } from "@/lib/youtube";

type Mode = "file" | "youtube";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

async function trimVideo(
  file: File,
  start: number,
  end: number,
  onProgress: (p: number) => void,
): Promise<File> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    const src = URL.createObjectURL(file);
    video.src = src;

    video.onloadedmetadata = () => {
      // Detect browser support
      const cap =
        (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream })
          .captureStream ??
        (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream })
          .mozCaptureStream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

      if (!cap || !mimeType) {
        URL.revokeObjectURL(src);
        resolve(file);
        return;
      }

      const stream = cap.call(video);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(src);
        const blob = new Blob(chunks, { type: "video/webm" });
        const trimmed = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, ".webm"),
          { type: "video/webm" },
        );
        onProgress(1);
        resolve(trimmed);
      };

      video.currentTime = start;
      video.onseeked = () => {
        const duration = end - start;
        let elapsed = 0;
        const tick = setInterval(() => {
          elapsed += 0.2;
          onProgress(Math.min(elapsed / duration, 0.95));
        }, 200);

        recorder.start(200);
        video.play();

        setTimeout(() => {
          clearInterval(tick);
          recorder.stop();
          video.pause();
        }, duration * 1000 + 300);
      };

      video.onerror = () => { URL.revokeObjectURL(src); resolve(file); };
    };

    video.onerror = () => resolve(file);
  });
}

export default function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  const [mode, setMode] = useState<Mode>("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  // Trim state
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimProgress, setTrimProgress] = useState<number | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    if (!file) { setVideoObjectUrl(null); return; }
    const url = URL.createObjectURL(file);
    setVideoObjectUrl(url);
    setTrimStart(0);
    setTrimEnd(0);
    setVideoDuration(0);
  }

  function handleMetadataLoaded() {
    const dur = previewRef.current?.duration ?? 0;
    setVideoDuration(isFinite(dur) ? dur : 0);
    setTrimEnd(isFinite(dur) ? dur : 0);
  }

  const isTrimmed = trimStart > 0 || (videoDuration > 0 && trimEnd < videoDuration);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTrimProgress(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

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
        let file = formData.get("video") as File;

        if (isTrimmed && videoDuration > 0) {
          setProgress("Trimming video… (plays in real-time)");
          setTrimProgress(0);
          file = await trimVideo(file, trimStart, trimEnd, (p) => setTrimProgress(p));
          setTrimProgress(null);
        }

        setProgress("Uploading video…");
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/submissions/upload",
        });
        videoUrl = blob.url;
      }

      setProgress("Saving…");
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, videoUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Upload failed");
        return;
      }

      formRef.current?.reset();
      setYoutubeUrl("");
      setVideoObjectUrl(null);
      setVideoDuration(0);
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "Upload failed");
    } finally {
      setLoading(false);
      setProgress(null);
      setTrimProgress(null);
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
        <>
          <label className="flex flex-col gap-1 text-sm">
            Video file
            <input
              name="video"
              type="file"
              accept="video/*"
              required
              onChange={handleFileChange}
              className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          {/* Trim UI */}
          {videoObjectUrl && (
            <div className="flex flex-col gap-2 rounded border border-zinc-200 p-3 dark:border-zinc-700">
              <video
                ref={previewRef}
                src={videoObjectUrl}
                controls
                onLoadedMetadata={handleMetadataLoaded}
                className="max-h-48 w-full rounded bg-black object-contain"
              />

              {videoDuration > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Trim</span>
                    <span>
                      {formatTime(trimStart)} → {formatTime(trimEnd)}{" "}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        ({formatTime(trimEnd - trimStart)})
                      </span>
                    </span>
                  </div>
                  <label className="flex flex-col gap-1 text-xs text-zinc-500">
                    Start
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={0.1}
                      value={trimStart}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setTrimStart(Math.min(v, trimEnd - 0.5));
                        if (previewRef.current) previewRef.current.currentTime = v;
                      }}
                      className="w-full accent-zinc-900 dark:accent-zinc-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-zinc-500">
                    End
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={0.1}
                      value={trimEnd}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setTrimEnd(Math.max(v, trimStart + 0.5));
                        if (previewRef.current) previewRef.current.currentTime = v;
                      }}
                      className="w-full accent-zinc-900 dark:accent-zinc-100"
                    />
                  </label>
                  {isTrimmed && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Trimming re-plays the clip in real-time ({formatTime(trimEnd - trimStart)}).
                    </p>
                  )}
                </>
              )}

              {trimProgress !== null && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                    style={{ width: `${Math.round(trimProgress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          YouTube URL
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
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
        className="w-full rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:w-auto"
      >
        {loading ? (progress ?? "Saving…") : mode === "youtube" ? "Add video" : "Upload"}
      </button>
    </form>
  );
}
