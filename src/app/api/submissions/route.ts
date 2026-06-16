import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/ogg", "video/x-m4v"];

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

  const formData = await req.formData();
  const title = formData.get("title");
  const movementType = formData.get("movementType");
  const file = formData.get("video");

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof movementType !== "string" || !movementType.trim()) {
    return NextResponse.json({ error: "Movement type is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Video file is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported video format" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Video is too large (max 200MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const videoUrl = await saveFile(buffer, file.name);

  const submission = await prisma.submission.create({
    data: {
      athleteId: session.user.id,
      title: title.trim(),
      movementType: movementType.trim(),
      videoUrl,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
