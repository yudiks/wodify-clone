"use client";

import { useState, useRef, useEffect } from "react";

export default function ShareLink({ submissionId }: { submissionId: string }) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (!shareToken) {
            generateShareLink();
          }
          setOpen(!open);
        }}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg z-50">
          {!shareToken ? (
            <div className="text-center">
              <p className="mb-3 text-sm text-zinc-600">
                Generate a shareable link for this submission
              </p>
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-zinc-300"
              >
                {loading ? "Generating..." : "Generate Share Link"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-700">Share Link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/share/${shareToken}`}
                    readOnly
                    className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-600"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Anyone with this link can view this submission and all feedback.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
