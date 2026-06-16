import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Coaches can annotate any submission; athletes can only annotate their own
  const isCoach = session.user.role === "COACH";
  const isOwner = submission.athleteId === session.user.id;
  if (!isCoach && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { timestampSec, drawingDataUrl, note } = await req.json();

  if (typeof timestampSec !== "number" || timestampSec < 0) {
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
  }
  // drawingDataUrl is optional — empty string for YouTube/no-drawing annotations
  if (typeof drawingDataUrl !== "string" ||
      (drawingDataUrl !== "" && !drawingDataUrl.startsWith("data:image/"))) {
    return NextResponse.json({ error: "Invalid drawing data" }, { status: 400 });
  }
  if (typeof note !== "string" || !note.trim()) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }

  const annotation = await prisma.annotation.create({
    data: {
      submissionId: id,
      coachId: session.user.id,
      timestampSec,
      drawingDataUrl,
      note: note.trim(),
    },
    include: { coach: { select: { name: true } } },
  });

  // Only mark as REVIEWED when a coach annotates
  if (isCoach) {
    await prisma.submission.update({
      where: { id },
      data: { status: "REVIEWED" },
    });
  }

  return NextResponse.json(annotation, { status: 201 });
}
