import { NextRequest, NextResponse } from "next/server";
import { read } from "@/utils/persistance";
import { Run } from "@/types/run";

export const runtime = "nodejs";

type Event = {
  type: string;
  ts_ms: number;
  payload: {
    tag?: string | null;
    id?: string | null;
    name?: string | null;
    cls?: string | null;
    value?: string | null;
    href?: string | null;
    text?: string;
    msg?: string;
    src?: string | null;
  };
};

type RunDetails = {
  run: Run;
  events: Event[];
  finishData?: unknown;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: "Missing run ID" }, { status: 400 });
    }

    // Get the run data
    const run = await read<Run>("runs", runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Get the events for this run
    const events = (await read<Event[]>("run_events", runId)) || [];

    // Get finish data if it exists
    const finishData = await read("run_finish_data", runId);

    const response: RunDetails = {
      run,
      events,
      ...(finishData && { finishData }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error retrieving run:", error);
    return NextResponse.json(
      { error: "Failed to retrieve run" },
      { status: 500 }
    );
  }
}
