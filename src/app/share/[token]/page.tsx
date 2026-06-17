"use client";

import { useEffect, useState } from "react";
import SubmissionReview from "@/components/SubmissionReview";

type Annotation = {
  id: string;
  timestampSec: number;
  drawingDataUrl: string;
  note: string;
  createdAt: string;
  coach: { name: string };
};

type Comment = {
  id: string;
  text: string;
  timestampSec: number | null;
  createdAt: string;
  author: { name: string; role: "ATHLETE" | "COACH" };
};

type Submission = {
  id: string;
  title: string;
  movementType: string;
  videoUrl: string;
  status: string;
  createdAt: string;
  athlete: { id: string; name: string };
  annotations: Annotation[];
  comments: Comment[];
};

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token);
      fetch(`/api/share/${token}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Submission not found");
          }
          return res.json();
        })
        .then((data) => {
          setSubmission(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    });
  }, [params]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <p className="text-center text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <p className="text-center text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <p className="text-center text-zinc-500">Submission not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">{submission.title}</h1>
        <p className="text-sm text-zinc-500">
          {submission.movementType} · {submission.athlete.name} ·{" "}
          {new Date(submission.createdAt).toLocaleString()}
        </p>
      </div>
      <SubmissionReview
        submissionId={submission.id}
        videoUrl={submission.videoUrl}
        annotations={submission.annotations}
        comments={submission.comments}
        isCoach={false}
        canAnnotate={false}
      />
    </div>
  );
}
