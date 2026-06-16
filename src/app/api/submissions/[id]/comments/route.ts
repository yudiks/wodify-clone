import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { text, timestampSec } = await req.json();

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "COACH" && submission.athleteId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.comment.create({
    data: {
      submissionId: id,
      authorId: session.user.id,
      text: text.trim(),
      timestampSec: typeof timestampSec === "number" ? timestampSec : null,
    },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
