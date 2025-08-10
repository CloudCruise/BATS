import { NextRequest, NextResponse } from "next/server";
import { persist, read } from "@/utils/persistance";
import { Run } from "@/types/run";

export const runtime = "nodejs";

type FinishData = {
  extra?: unknown;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runId = params.id;

    if (!runId) {
      return NextResponse.json({ error: "Missing run ID" }, { status: 400 });
    }

    // Get the existing run
    const run = await read<Run>("runs", runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Parse finish data
    const body: FinishData = await req.json();

    // Update the run with finish information
    const updatedRun: Run = {
      ...run,
      finishedAt: new Date(),
      success: true, // Assume success if manually finished
    };

    // Persist the updated run
    await persist("runs", runId, updatedRun);

    // If there's extra data, persist it separately
    if (body.extra) {
      await persist("run_finish_data", runId, {
        runId,
        finishedAt: updatedRun.finishedAt,
        extra: body.extra,
      });
    }

    console.log(`Run ${runId} marked as finished`);

    return NextResponse.json({
      success: true,
      runId,
      finishedAt: updatedRun.finishedAt,
    });
  } catch (error) {
    console.error("Error finishing run:", error);
    return NextResponse.json(
      { error: "Failed to finish run" },
      { status: 500 }
    );
  }
}
