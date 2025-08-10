import { NextRequest, NextResponse } from "next/server";
import { persist, read } from "@/utils/persistance";
import { Run } from "@/types/run";
import path from "path";
import fs from "fs/promises";

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

type EventBatch = {
  agent_name: string;
  events: Event[];
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

    // Verify the run exists
    const run = await read<Run>("runs", runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const body: EventBatch = await req.json();

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: "Invalid events data" },
        { status: 400 }
      );
    }

    // Get existing events or initialize empty array
    const existingEvents = (await read<Event[]>("run_events", runId)) || [];

    // Add new events to existing ones
    const allEvents = [...existingEvents, ...body.events];

    // Persist the updated events
    await persist("run_events", runId, allEvents);

    console.log(`Recorded ${body.events.length} events for run ${runId}`);

    return NextResponse.json({
      success: true,
      recorded: body.events.length,
      total: allEvents.length,
    });
  } catch (error) {
    console.error("Error recording events:", error);
    return NextResponse.json(
      { error: "Failed to record events" },
      { status: 500 }
    );
  }
}
