"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteReviewButton({
  submissionId,
  status,
}: {
  submissionId: string;
  status: "PENDING" | "REVIEWED";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isReviewed = status === "REVIEWED";

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isReviewed ? "PENDING" : "REVIEWED" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isReviewed ? "Mark as pending" : "Mark feedback as complete"}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        isReviewed ? "status-pill reviewed" : "btn-glow-blue"
      }`}
    >
      {isReviewed ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Reviewed
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
          Mark as reviewed
        </>
      )}
    </button>
  );
}
