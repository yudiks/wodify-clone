"use client";

import { useState, useRef, useEffect } from "react";

export default function ShareLink({ submissionId }: { submissionId: string }) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Position the popover so it never clips off the left edge
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 16);
    // Align right edge of popover with right edge of button; clamp left to 8px
    const rightAligned = rect.right - popoverWidth;
    const left = Math.max(8, rightAligned);
    setPopoverStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width: popoverWidth,
    });
  }, [open]);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/share`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setShareToken(data.shareToken);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareToken) return;
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref}>
      <button
        ref={btnRef}
        onClick={() => {
          if (!shareToken) generateShareLink();
          setOpen(!open);
        }}
        title="Share submission"
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
        style={{ color: "var(--text-muted)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
        </svg>
      </button>

      {open && (
        <div
          className="card-glass z-50 p-4 shadow-[var(--shadow-main)]"
          style={{ ...popoverStyle, background: "var(--bg-secondary)" }}
        >
          {!shareToken ? (
            <div className="text-center">
              <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                Generate a shareable link for this submission
              </p>
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="btn-glow-blue w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Share Link"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Share Link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/share/${shareToken}`}
                    readOnly
                    className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-xs font-mono"
                    style={{ borderColor: "var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn-glow-blue shrink-0 rounded-lg px-3 py-2 text-xs font-medium"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Anyone with this link can view this submission and all feedback.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
