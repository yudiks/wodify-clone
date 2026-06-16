"use client";

import { useRef } from "react";
import VideoAnnotator from "@/components/VideoAnnotator";
import CommentThread from "@/components/CommentThread";

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

export default function SubmissionReview({
  submissionId,
  videoUrl,
  annotations,
  comments,
  isCoach,
}: {
  submissionId: string;
  videoUrl: string;
  annotations: Annotation[];
  comments: Comment[];
  isCoach: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <VideoAnnotator
        submissionId={submissionId}
        videoUrl={videoUrl}
        annotations={annotations}
        isCoach={isCoach}
        videoRef={videoRef}
      />
      <CommentThread submissionId={submissionId} comments={comments} videoRef={videoRef} />
    </div>
  );
}
