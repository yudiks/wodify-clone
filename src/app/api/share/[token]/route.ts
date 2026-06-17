import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const submission = await prisma.submission.findUnique({
    where: { shareToken: token },
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

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: submission.id,
    title: submission.title,
    movementType: submission.movementType,
    videoUrl: submission.videoUrl,
    status: submission.status,
    athlete: submission.athlete,
    annotations: submission.annotations.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    comments: submission.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    createdAt: submission.createdAt.toISOString(),
  });
}
