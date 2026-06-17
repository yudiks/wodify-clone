"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isYouTubeUrl } from "@/lib/youtube";

type Annotation = {
  id: string;
  timestampSec: number;
  drawingDataUrl: string;
  note: string;
  createdAt: string;
  coach: { name: string };
};

const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ffffff"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---- YouTube branch ----

function YouTubePlayerSection({
  videoUrl,
  submissionId,
  annotations,
  canAnnotate,
}: {
  videoUrl: string;
  submissionId: string;
  annotations: Annotation[];
  canAnnotate: boolean;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [ytReady, setYtReady] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);

  useEffect(() => {
    function initPlayer() {
      if (!iframeRef.current || !(window as { YT?: { Player: unknown } }).YT) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: { onReady: () => setYtReady(true) },
      });
    }

    if ((window as { YT?: { Player: unknown } }).YT?.Player) {
      initPlayer();
    } else {
      const prev = (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
      (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Poll playback position while YouTube video is playing to auto-show annotations.
  useEffect(() => {
    if (!ytReady) return;
    const id = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: number = (playerRef.current as any)?.getPlayerState?.() ?? -1;
      if (state !== 1) return; // 1 = playing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t: number = (playerRef.current as any)?.getCurrentTime?.() ?? 0;
      const candidates = annotations.filter(
        (a) => t >= a.timestampSec && t <= a.timestampSec + 3,
      );
      const match = candidates[candidates.length - 1] ?? null;
      setActiveAnnotation((prev) => (prev?.id === match?.id ? prev : match));
    }, 250);
    return () => clearInterval(id);
  }, [ytReady, annotations]);

  const embedSrc = videoUrl.includes("enablejsapi")
    ? videoUrl
    : `${videoUrl}?enablejsapi=1`;

  function handleAnnotationClick(a: Annotation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (playerRef.current as any)?.seekTo?.(a.timestampSec, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (playerRef.current as any)?.pauseVideo?.();
    setActiveAnnotation(activeAnnotation?.id === a.id ? null : a);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded bg-black" style={{ aspectRatio: "16/9" }}>
        <iframe
          ref={iframeRef}
          src={embedSrc}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {annotations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {annotations.map((a) => (
            <button
              key={a.id}
              onClick={() => handleAnnotationClick(a)}
              className={`rounded border px-2 py-1 text-xs ${
                activeAnnotation?.id === a.id
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-400"
              }`}
            >
              {formatTime(a.timestampSec)}
            </button>
          ))}
        </div>
      )}

      {activeAnnotation && (
        <div className="rounded border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium">
            {activeAnnotation.coach.name} at {formatTime(activeAnnotation.timestampSec)}
          </p>
          <p className="text-zinc-700 dark:text-zinc-300">{activeAnnotation.note}</p>
        </div>
      )}

      {canAnnotate && (
        <div className="rounded border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <YouTubeAnnotationForm
            submissionId={submissionId}
            playerRef={playerRef}
            ytReady={ytReady}
            router={router}
          />
        </div>
      )}
    </div>
  );
}

function YouTubeAnnotationForm({
  submissionId,
  playerRef,
  ytReady,
  router,
}: {
  submissionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playerRef: React.RefObject<any>;
  ytReady: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [capturedTime, setCapturedTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function captureTime() {
    const t: number = playerRef.current?.getCurrentTime?.() ?? 0;
    playerRef.current?.pauseVideo?.();
    setCapturedTime(Math.round(t));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/submissions/${submissionId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestampSec: capturedTime ?? 0, drawingDataUrl: "", note }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Failed to save");
      return;
    }
    setNote("");
    setCapturedTime(null);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
      >
        Add annotation
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Play the video to the moment you want to annotate, then tap &ldquo;Capture timestamp&rdquo;.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={captureTime}
          disabled={!ytReady}
          className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {ytReady ? "Capture timestamp" : "Loading player…"}
        </button>
        {capturedTime !== null && (
          <span className="font-mono text-sm font-medium">{formatTime(capturedTime)}</span>
        )}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What should the athlete focus on?"
        className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        rows={3}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={saving || !note.trim() || capturedTime === null}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save annotation"}
        </button>
        <button
          onClick={() => { setOpen(false); setCapturedTime(null); setNote(""); }}
          className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---- Regular video branch ----

export default function VideoAnnotator({
  submissionId,
  videoUrl,
  annotations,
  isCoach,
  canAnnotate,
  videoRef,
}: {
  submissionId: string;
  videoUrl: string;
  annotations: Annotation[];
  isCoach: boolean;
  canAnnotate: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Sync canvas pixel buffer to its CSS rendered size whenever it changes.
  // ResizeObserver is more reliable than window resize or video metadata events
  // because it fires after layout, including on initial mount and orientation changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function sync() {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
      }
    }
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    sync();
    return () => observer.disconnect();
  }, []);

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    e.preventDefault();
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing || !isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const point = getCanvasPoint(e);
    const last = lastPointRef.current;
    if (last) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
  }

  function handlePointerUp() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function viewAnnotation(annotation: Annotation) {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = annotation.timestampSec;
    }
    clearCanvas();
    setDrawing(false);
    setActiveAnnotation(annotation);
  }

  function startNewAnnotation() {
    setActiveAnnotation(null);
    setNote("");
    clearCanvas();
    setDrawing(true);
    videoRef.current?.pause();
  }

  async function saveAnnotation() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setSaving(true);
    setError(null);

    const drawingDataUrl = canvas.toDataURL("image/png");
    const res = await fetch(`/api/submissions/${submissionId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestampSec: video.currentTime,
        drawingDataUrl,
        note,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Failed to save annotation");
      return;
    }

    setDrawing(false);
    setNote("");
    clearCanvas();
    router.refresh();
  }

  if (isYouTubeUrl(videoUrl)) {
    return (
      <YouTubePlayerSection
        videoUrl={videoUrl}
        submissionId={submissionId}
        annotations={annotations}
        canAnnotate={canAnnotate}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="relative w-full overflow-hidden rounded bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          className="max-h-72 w-full object-contain"
          onPlay={() => {
            if (drawing) return;
            clearCanvas();
          }}
          onTimeUpdate={() => {
            if (drawing) return;
            const t = videoRef.current?.currentTime ?? 0;
            const candidates = annotations.filter(
              (a) => t >= a.timestampSec && t <= a.timestampSec + 3,
            );
            const match = candidates[candidates.length - 1] ?? null;
            setActiveAnnotation((prev) => (prev?.id === match?.id ? prev : match));
          }}
        />
        {activeAnnotation && activeAnnotation.drawingDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeAnnotation.drawingDataUrl}
            alt="Annotation drawing"
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
          />
        )}
        <canvas
          ref={canvasRef}
          className={`absolute left-0 top-0 h-full w-full ${
            drawing ? "cursor-crosshair" : "pointer-events-none"
          }`}
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {annotations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {annotations.map((a) => (
            <button
              key={a.id}
              onClick={() => viewAnnotation(a)}
              className={`rounded border px-2 py-1 text-xs ${
                activeAnnotation?.id === a.id
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-400"
              }`}
            >
              {formatTime(a.timestampSec)}
            </button>
          ))}
        </div>
      )}

      {activeAnnotation && (
        <div className="rounded border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium">
            {activeAnnotation.coach.name} at {formatTime(activeAnnotation.timestampSec)}
          </p>
          <p className="text-zinc-700 dark:text-zinc-300">{activeAnnotation.note}</p>
        </div>
      )}

      {canAnnotate && (
        <div className="rounded border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {!drawing ? (
            <button
              onClick={startNewAnnotation}
              className="w-full rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 sm:w-auto"
            >
              Add annotation at current frame
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Draw on the frame, add a note, then save. ({formatTime(videoRef.current?.currentTime ?? 0)})
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Color:</span>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      color === c ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <button
                  onClick={clearCanvas}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What should the athlete focus on?"
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                rows={3}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={saveAnnotation}
                  disabled={saving || !note.trim()}
                  className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save annotation"}
                </button>
                <button
                  onClick={() => { setDrawing(false); clearCanvas(); }}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
