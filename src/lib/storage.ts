import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Local filesystem storage. Swap this implementation for an S3-compatible
 * client if deploying somewhere without a persistent volume (e.g. Vercel).
 */
export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  await writeFile(path.join(UPLOAD_DIR, safeName), buffer);
  return getFileUrl(safeName);
}

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
