"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Annotation = {
  id: string;
  timestampSec: number;
  drawingDataUrl: string;
  note: string;
  createdAt: string;
  coach: { name: string };
};

const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ffffff"];

export default function VideoAnnotator({
  submissionId,
  videoUrl,
  annotations,
  isCoach,
  videoRef,
}: {
  submissionId: string;
  videoUrl: string;
  annotations: Annotation[];
  isCoach: boolean;
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

  // Keep canvas pixel size matched to the rendered video size.
  useEffect(() => {
    function resize() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isCoach || !drawing) return;
    isDrawingRef.current = true;
    lastPointRef.current = getCanvasPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isCoach || !drawing || !isDrawingRef.current) return;
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
      setError(data.error ?? "Failed to save annotation");
      return;
    }

    setDrawing(false);
    setNote("");
    clearCanvas();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="relative w-full overflow-hidden rounded bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full"
          onPlay={() => {
            if (activeAnnotation) {
              setActiveAnnotation(null);
              clearCanvas();
            }
          }}
          onLoadedMetadata={() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;
            const rect = video.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
          }}
        />
        {activeAnnotation && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeAnnotation.drawingDataUrl}
            alt="Coach annotation"
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
          />
        )}
        <canvas
          ref={canvasRef}
          className={`absolute left-0 top-0 h-full w-full ${
            drawing ? "cursor-crosshair" : "pointer-events-none"
          }`}
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
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 hover:border-zinc-500"
              }`}
            >
              {formatTime(a.timestampSec)}
            </button>
          ))}
        </div>
      )}

      {activeAnnotation && (
        <div className="rounded border border-zinc-200 bg-white p-3 text-sm">
          <p className="font-medium">
            {activeAnnotation.coach.name} at {formatTime(activeAnnotation.timestampSec)}
          </p>
          <p className="text-zinc-700">{activeAnnotation.note}</p>
        </div>
      )}

      {isCoach && (
        <div className="rounded border border-zinc-200 bg-white p-3">
          {!drawing ? (
            <button
              onClick={startNewAnnotation}
              className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Add annotation at current frame
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600">
                Pause the video where you want to comment, draw on the frame
                below, add a note, then save. ({formatTime(videoRef.current?.currentTime ?? 0)})
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm">Color:</span>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${
                      color === c ? "border-zinc-900" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <button
                  onClick={clearCanvas}
                  className="ml-2 rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                >
                  Clear drawing
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What should the athlete focus on?"
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
                rows={3}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={saveAnnotation}
                  disabled={saving || !note.trim()}
                  className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save annotation"}
                </button>
                <button
                  onClick={() => {
                    setDrawing(false);
                    clearCanvas();
                  }}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
