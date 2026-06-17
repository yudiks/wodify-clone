import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Only the athlete who created the submission or a coach can generate a share link
  if (
    session.user.role !== "COACH" &&
    submission.athleteId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Generate or return existing share token
  let shareToken = submission.shareToken;
  if (!shareToken) {
    shareToken = nanoid(12);
    await prisma.submission.update({
      where: { id },
      data: { shareToken },
    });
  }

  return NextResponse.json({ shareToken });
}
