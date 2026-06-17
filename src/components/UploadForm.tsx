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
): Promise<{ file: File; trimmed: boolean }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    // captureStream only reliably produces frames once the element is part
    // of the document — a detached <video> silently records a blank/frozen
    // stream in several browsers, which looked like "trimming did nothing".
    video.style.position = "fixed";
    video.style.top = "-9999px";
    video.style.width = "1px";
    video.style.height = "1px";
    document.body.appendChild(video);

    const src = URL.createObjectURL(file);
    video.src = src;

    function cleanup() {
      URL.revokeObjectURL(src);
      video.remove();
    }

    function fallback() {
      cleanup();
      resolve({ file, trimmed: false });
    }

    video.onloadedmetadata = () => {
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
        fallback();
        return;
      }

      const stream = cap.call(video);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      let stopped = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: "video/webm" });
        const trimmedFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, ".webm"),
          { type: "video/webm" },
        );
        onProgress(1);
        resolve({ file: trimmedFile, trimmed: true });
      };

      function stopRecording() {
        if (stopped) return;
        stopped = true;
        video.removeEventListener("timeupdate", onTimeUpdate);
        clearTimeout(safetyTimer);
        recorder.stop();
        video.pause();
      }

      function onTimeUpdate() {
        const duration = end - start;
        const elapsed = video.currentTime - start;
        onProgress(Math.min(Math.max(elapsed / duration, 0), 0.95));
        if (video.currentTime >= end) stopRecording();
      }

      // Backstop in case timeupdate doesn't fire enough (e.g. throttled
      // background tab) so the recording always terminates.
      const safetyTimer = setTimeout(stopRecording, (end - start) * 1000 + 1500);

      video.currentTime = start;
      video.onseeked = () => {
        video.onseeked = null;
        video
          .play()
          .then(() => {
            video.addEventListener("timeupdate", onTimeUpdate);
            recorder.start(200);
          })
          .catch(() => {
            stopped = true;
            clearTimeout(safetyTimer);
            fallback();
          });
      };

      video.onerror = fallback;
    };

    video.onerror = fallback;
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
          const result = await trimVideo(file, trimStart, trimEnd, (p) => setTrimProgress(p));
          setTrimProgress(null);
          file = result.file;
          if (!result.trimmed) {
            setError(
              "Your browser doesn't support trimming videos, so the full video was uploaded instead.",
            );
          }
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

  const fieldStyle = {
    borderColor: "var(--border-color)",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="card-glass flex flex-col gap-4 p-5"
    >
      <h2 className="font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>
        Upload a new video
      </h2>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Title
        <input
          name="title"
          required
          placeholder="e.g. Heavy single snatch attempt"
          className="rounded-lg border px-3 py-2"
          style={fieldStyle}
        />
      </label>

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg border p-1 text-sm" style={{ borderColor: "var(--border-color)" }}>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${mode === "file" ? "btn-glow-blue" : ""}`}
          style={mode === "file" ? undefined : { color: "var(--text-secondary)" }}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode("youtube")}
          className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${mode === "youtube" ? "btn-glow-blue" : ""}`}
          style={mode === "youtube" ? undefined : { color: "var(--text-secondary)" }}
        >
          YouTube link
        </button>
      </div>

      {mode === "file" ? (
        <>
          <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Video file
            <input
              name="video"
              type="file"
              accept="video/*"
              required
              onChange={handleFileChange}
              className="rounded-lg border px-3 py-2"
              style={fieldStyle}
            />
          </label>

          {/* Trim UI */}
          {videoObjectUrl && (
            <div className="flex flex-col gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border-color)" }}>
              <video
                ref={previewRef}
                src={videoObjectUrl}
                controls
                onLoadedMetadata={handleMetadataLoaded}
                className="max-h-48 w-full rounded-lg object-contain"
                style={{ background: "var(--bg-tertiary)" }}
              />

              {videoDuration > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Trim</span>
                    <span>
                      {formatTime(trimStart)} → {formatTime(trimEnd)}{" "}
                      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                        ({formatTime(trimEnd - trimStart)})
                      </span>
                    </span>
                  </div>
                  <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
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
                      className="w-full"
                      style={{ accentColor: "var(--accent-blue)" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
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
                      className="w-full"
                      style={{ accentColor: "var(--accent-blue)" }}
                    />
                  </label>
                  {isTrimmed && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Trimming re-plays the clip in real-time ({formatTime(trimEnd - trimStart)}).
                    </p>
                  )}
                </>
              )}

              {trimProgress !== null && (
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round(trimProgress * 100)}%`, background: "var(--accent-blue)" }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          YouTube URL
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            required
            className="rounded-lg border px-3 py-2"
            style={fieldStyle}
          />
          {youtubeUrl && !youtubeValid && (
            <span className="text-xs" style={{ color: "var(--accent-red)" }}>Paste a youtube.com or youtu.be link</span>
          )}
          {youtubeValid && (
            <span className="text-xs" style={{ color: "var(--accent-green)" }}>✓ Valid YouTube link</span>
          )}
        </label>
      )}

      {error && <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || (mode === "youtube" && !youtubeValid)}
        className="btn-glow-blue w-full rounded-lg px-4 py-2 text-sm disabled:opacity-50 sm:w-auto"
      >
        {loading ? (progress ?? "Saving…") : mode === "youtube" ? "Add video" : "Upload"}
      </button>
    </form>
  );
}
