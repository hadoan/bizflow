import { NextRequest, NextResponse } from "next/server";
import { createClient, listClients } from "@/modules/crm/services";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const clients = await listClients(space.id);
    return NextResponse.json(clients);
  } catch (error) {
    console.error("List clients error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch clients";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const body = await req.json();
    const client = await createClient(space.id, body);

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    const message = error instanceof Error ? error.message : "Failed to create client";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}