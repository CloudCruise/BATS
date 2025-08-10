"use client";

import { useState, useEffect } from "react";
import { Run } from "@/types/run";
import { Skeleton } from "@/components/ui/skeleton";
import { TestCase } from "@/types/testcase";
import { useRouter } from "next/navigation";
import { SidebarInset } from "@/components/sidebar-inset";

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [testCases, setTestCases] = useState<TestCase[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTestCases() {
      const res = await fetch("/api/runs");
      const data = await res.json();
      setRuns(data.runs);
      const testCase = await fetch(`/api/test-cases`);
      const testCaseData = await testCase.json();
      setTestCases(testCaseData);
      setLoading(false);
    }
    fetchTestCases();
  }, []);

  return (
    <SidebarInset>
      <div className="flex w-full max-w-screen-md flex-col gap-4 p-4 text-white mx-auto">
        <h1 className="text-2xl font-bold">All Runs</h1>
        {loading ? (
          <div className="flex w-full justify-center">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {runs &&
              runs?.map((run) => (
                <div
                  key={run.id}
                  className="flex flex-col gap-2 p-4 rounded-xl transition-all duration-200 text-left group w-full border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    router.push(`/runs/${run.id}`);
                  }}
                >
                  <div className="flex justify-between gap-1">
                    <div className="text-sm font-medium">
                      {
                        testCases?.find(
                          (testCase) => testCase.id === run.testId
                        )?.name
                      }
                    </div>
                    <div className="text-xs text-white/60">
                      {new Date(run.startedAt).toLocaleDateString()}{" "}
                      {new Date(run.startedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-xs text-white/70">{run.id}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
