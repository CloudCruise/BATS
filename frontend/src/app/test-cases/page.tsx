"use client";

import { useState, useEffect } from "react";
import { TestCase } from "@/types/testcase";
import { Skeleton } from "@/components/ui/skeleton";
import { TestCaseBubble } from "@/components/test-case-bubble";

export default function TestCasesPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestCases() {
      const res = await fetch("/api/test-cases");
      const data = await res.json();
      setTestCases(data);
      setLoading(false);
    }
    fetchTestCases();
  }, []);

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-screen-md flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        {loading ? (
          <div className="flex w-full justify-center">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {testCases.map((testCase) => (
              <TestCaseBubble
                key={testCase.id}
                testCase={testCase}
                backgroundTransparent={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
