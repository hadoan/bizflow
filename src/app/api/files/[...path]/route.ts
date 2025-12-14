import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const pathname = req.nextUrl.pathname.replace(/^\/api\/files\//, "");
    const key = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const buffer = await storage.download(key);
    const contentType = key.endsWith(".svg")
      ? "image/svg+xml"
      : key.endsWith(".png")
        ? "image/png"
        : key.endsWith(".jpg") || key.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream";

    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
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
