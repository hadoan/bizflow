import { NextRequest, NextResponse } from "next/server";
import { createTask, listOpenTasks } from "@/modules/tasks/services";
import { getCurrentUserWithSpace } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const tasks = await listOpenTasks(space.id);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("List tasks error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch tasks";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user and their default space
    const { space } = await getCurrentUserWithSpace();

    const body = await req.json();
    const task = await createTask(space.id, body);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    const message = error instanceof Error ? error.message : "Failed to create task";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}