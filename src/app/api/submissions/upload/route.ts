import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/ogg", "video/x-m4v"];
const MAX_FILE_SIZE = 200 * 1024 * 1024;

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session || session.user.role !== "ATHLETE") {
          throw new Error("Unauthorized");
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
