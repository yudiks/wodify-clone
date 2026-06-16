import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await prisma.submission.findMany({
    where: session.user.role === "COACH" ? {} : { athleteId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      athlete: { select: { name: true } },
      _count: { select: { annotations: true, comments: true } },
    },
  });

  return NextResponse.json(submissions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Only athletes can submit videos" }, { status: 403 });
  }

  const body = await req.json();
  const { title, videoUrl } = body;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof videoUrl !== "string" || !videoUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Valid video URL is required" }, { status: 400 });
  }

  const submission = await prisma.submission.create({
    data: {
      athleteId: session.user.id,
      title: title.trim(),
      movementType: "",
      videoUrl,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
