import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SubmissionReview from "@/components/SubmissionReview";
import ShareLink from "@/components/ShareLink";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      athlete: { select: { id: true, name: true } },
      annotations: {
        orderBy: { timestampSec: "asc" },
        include: { coach: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });

  if (!submission) notFound();

  if (session.user.role !== "COACH" && submission.athleteId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{submission.title}</h1>
          <p className="text-sm text-zinc-500">
            {submission.movementType} · {submission.athlete.name} ·{" "}
            {new Date(submission.createdAt).toLocaleString()}
          </p>
        </div>
        <ShareLink submissionId={submission.id} />
      </div>
      <SubmissionReview
        submissionId={submission.id}
        videoUrl={submission.videoUrl}
        annotations={submission.annotations.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
        comments={submission.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        }))}
        isCoach={session.user.role === "COACH"}
      />
    </div>
  );
}
