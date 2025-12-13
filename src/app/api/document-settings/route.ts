import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { getDocumentSettings, updateDocumentSettings } from "@/modules/documents/services";

export async function GET() {
  try {
    const { space } = await getCurrentUserWithSpace();
    const settings = await getDocumentSettings(space.id);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch document settings";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { space } = await getCurrentUserWithSpace();
    const body = await req.json();
    const settings = await updateDocumentSettings(space.id, body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update document settings error:", error);
    const message = error instanceof Error ? error.message : "Failed to update document settings";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
