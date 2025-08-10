"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { TestCase } from "@/types/testcase";
import { useEffect, useState, use } from "react";
import { TestCaseInfo } from "@/components/test-case-info";
import { SidebarInset } from "@/components/sidebar-inset";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from "@/components/web-preview";

export default function TestCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [testCase, setTestCase] = useState<TestCase | null>(null);

  useEffect(() => {
    async function fetchTestCase() {
      const res = await fetch(`/api/test-cases`);
      const data = await res.json();
      // Find the test case with the given id
      const testCase = data.find((testCase: TestCase) => testCase.id === id);
      setTestCase(testCase);
    }
    fetchTestCase();
  }, [id]);

  return (
    <SidebarInset>
      <div className="flex w-full h-full flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-4">
            {testCase && <TestCaseInfo testCase={testCase} />}
          </div>
          <div className="col-span-8 h-full">
            {testCase && (
              <WebPreview defaultUrl={testCase.pageUrl}>
                <WebPreviewNavigation className="justify-between">
                  <div className="flex-1 min-w-0">
                    <WebPreviewUrl src={testCase.pageUrl} />
                  </div>
                </WebPreviewNavigation>
                <WebPreviewBody src={testCase.pageUrl} />
              </WebPreview>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
