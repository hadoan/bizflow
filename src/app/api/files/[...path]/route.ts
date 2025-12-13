import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const key = params.path.join("/");
    const buffer = await storage.download(key);
    const contentType = key.endsWith(".svg")
      ? "image/svg+xml"
      : key.endsWith(".png")
        ? "image/png"
        : key.endsWith(".jpg") || key.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "File not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
