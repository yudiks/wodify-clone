import { put } from "@vercel/blob";

export async function saveFile(buffer: Buffer, filename: string): Promise<string> {
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { url } = await put(safeName, buffer, { access: "public" });
  return url;
}
