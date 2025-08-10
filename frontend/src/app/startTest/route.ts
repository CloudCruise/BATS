import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sign } from "@/utils/sign";
import { persist } from "@/utils/persistance";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const agent = searchParams.get("agent") ?? "unknown";

  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Ensure the HTML exists
  const htmlPath = path.join(
    process.cwd(),
    "public",
    "generated_websites",
    `${id}.html`
  );
  if (!fs.existsSync(htmlPath)) {
    return NextResponse.json({ error: "test not found" }, { status: 404 });
  }

  // Create run
  const runId = crypto.randomUUID();
  await persist("runs", runId, {
    id: runId,
    testId: id,
    agentName: agent,
    startedAt: new Date(),
  });

  // Set signed cookie so /success can identify the run
  const signed = sign(runId); // string
  (await cookies()).set({
    name: "bats_run",
    value: signed,
    httpOnly: true,
    sameSite: "lax", // string literal 'lax' is fine
    path: "/",
  });

  const to = `/generated_websites/${id}.html?run=${encodeURIComponent(
    runId
  )}&agent=${encodeURIComponent(agent)}`;
  return NextResponse.redirect(new URL(to, req.url), { status: 302 });
}
