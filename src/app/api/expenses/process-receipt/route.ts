import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithSpace } from "@/lib/auth";
import { processReceipt } from "@/modules/finance/services/expense-agent";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { space } = await getCurrentUserWithSpace();

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image or PDF." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Save file to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `${space.id}/receipts/${timestamp}-${safeName}`;

    // Create file record in database
    const fileRecord = await db.file.create({
      data: {
        spaceId: space.id,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        storageKey,
      },
    });

    // Convert to base64 for vision LLM (in production, you might store this differently)
    const base64Data = buffer.toString("base64");

    // Process receipt using agent
    const result = await processReceipt(
      space.id,
      fileRecord.id,
      base64Data,
      file.type
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Process receipt error:", error);
    const message = error instanceof Error ? error.message : "Failed to process receipt";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
