import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SubmissionReview from "@/components/SubmissionReview";
import DeleteSubmissionButton from "@/components/DeleteSubmissionButton";

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

  const isCoach = session.user.role === "COACH";
  const isOwner = submission.athleteId === session.user.id;

  if (!isCoach && !isOwner) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{submission.title}</h1>
          <p className="text-sm text-zinc-500">
            {submission.athlete.name} · {new Date(submission.createdAt).toLocaleString()}
          </p>
        </div>
        {isOwner && <DeleteSubmissionButton submissionId={submission.id} />}
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
        isCoach={isCoach}
        canAnnotate={isCoach || isOwner}
      />
    </div>
  );
}
