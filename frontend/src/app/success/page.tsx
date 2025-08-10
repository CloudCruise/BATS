import { cookies } from "next/headers";
import { unsign } from "@/utils/sign";
import { persist, read } from "@/utils/persistance";
import { Run } from "@/types/run";

export const runtime = "nodejs";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { run?: string };
}) {
  const cookie = (await cookies()).get("bats_run")?.value || "";
  const runId = searchParams.run || (cookie ? unsign(cookie) : "");

  if (runId) {
    // Read the current run
    const run = await read<Run>("runs", runId);
    if (run) {
      run.finishedAt = new Date();
      run.success = true;
      await persist("runs", runId, run);
    }
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>✅ Test finished</h1>
      <p>Run: {runId || "(unknown)"}.</p>
      <p>You can close this window.</p>
    </main>
  );
}
