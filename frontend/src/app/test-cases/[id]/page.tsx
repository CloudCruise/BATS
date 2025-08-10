"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { TestCase } from "@/types/testcase";
import { useEffect, useState } from "react";
import { TestCaseInfo } from "@/components/test-case-info";
import { SidebarInset } from "@/components/sidebar-inset";

export default function TestCasePage({ params }: { params: { id: string } }) {
  const [testCase, setTestCase] = useState<TestCase | null>(null);

  useEffect(() => {
    async function fetchTestCase() {
      const res = await fetch(`/api/test-cases`);
      const data = await res.json();
      // Find the test case with the given id
      const testCase = data.find(
        (testCase: TestCase) => testCase.id === params.id
      );
      setTestCase(testCase);
    }
    fetchTestCase();
  }, [params.id]);

  return (
    <SidebarInset>
      <div className="flex w-full flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        {testCase && <TestCaseInfo testCase={testCase} />}
      </div>
    </SidebarInset>
  );
}
