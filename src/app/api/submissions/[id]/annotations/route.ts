import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "COACH") {
    return NextResponse.json({ error: "Only coaches can add annotations" }, { status: 403 });
  }

  const { id } = await params;
  const { timestampSec, drawingDataUrl, note } = await req.json();

  if (typeof timestampSec !== "number" || timestampSec < 0) {
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
  }
  if (typeof drawingDataUrl !== "string" || !drawingDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid drawing data" }, { status: 400 });
  }
  if (typeof note !== "string") {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  await prisma.submission.update({
    where: { id },
    data: { status: "REVIEWED" },
  });

  return NextResponse.json(annotation, { status: 201 });
}
