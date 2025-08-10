import { NextResponse } from "next/server";
import { readAll } from "@/utils/persistance";
import { Run } from "@/types/run";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Get all runs
    const runs = await readAll<Run>("runs");

    // Sort by startedAt date (newest first)
    runs.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error retrieving runs:", error);
    return NextResponse.json(
      { error: "Failed to retrieve runs" },
      { status: 500 }
    );
  }
}
