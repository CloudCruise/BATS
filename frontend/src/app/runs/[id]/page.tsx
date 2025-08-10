"use client";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { EventToIcon } from "@/components/event-to-icon";
import { SidebarInset } from "@/components/sidebar-inset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Run } from "@/types/run";
import { TestCase } from "@/types/testcase";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Carousel } from "@/components/carousel";

export default function RunPage() {
  const { id } = useParams();
  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<
    { type: string; payload: unknown; ts_ms: number }[]
  >([]);
  const [finishData, setFinishData] = useState<unknown | null>(null);
  const [testCase, setTestCase] = useState<TestCase | null>(null);

  useEffect(() => {
    async function fetchRun() {
      const res = await fetch(`/api/runs/${id}`);
      const data = await res.json();
      setRun(data.run);
      setEvents(data.events);
      setFinishData(data.finishData);
      const testCase = await fetch(`/api/test-cases`);
      const testCaseData = await testCase.json();
      setTestCase(
        testCaseData.find(
          (testCase: TestCase) => testCase.id === data.run.testId
        )
      );
    }
    fetchRun();
  }, [id]);

  return (
    <SidebarInset>
      <div className="flex w-full h-full flex-col gap-4 p-4 h-full">
        <h1 className="text-2xl font-bold">Run {id}</h1>
        {run && (
          <div className="grid grid-cols-12 gap-4 h-full">
            <div className="flex flex-col gap-4 col-span-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle>Test Info</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex justify-between gap-2 items-center">
                    <div className="text-sm font-medium">Test Case</div>
                    <div className="text-xs text-muted-foreground">
                      {testCase?.name}
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <div className="text-sm font-medium">Started At</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(run.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <div className="text-sm font-medium">Finished At</div>
                    <div className="text-xs text-muted-foreground">
                      {run.finishedAt
                        ? new Date(run.finishedAt).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <div className="text-sm font-medium">Success</div>
                    <div className="text-xs text-muted-foreground">
                      {run.success ? "Yes" : "No"}
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <div className="text-sm font-medium">Agent</div>
                    <div className="text-xs text-muted-foreground">
                      {run.agentName}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-8 h-full">
                <CardHeader>
                  <CardTitle>Events</CardTitle>
                </CardHeader>
                <CardContent className="h-full overflow-y-auto">
                  <Accordion type="multiple">
                    {events
                      .filter((event) => event.type !== "screenshot")
                      .map((event, index) => (
                        <AccordionItem
                          key={index}
                          value={index.toString()}
                          className="border-none"
                        >
                          <AccordionTrigger>
                            <div className="text-sm font-medium flex items-center gap-2">
                              <EventToIcon
                                event={
                                  event.type as
                                    | "click"
                                    | "input"
                                    | "change"
                                    | "submit"
                                }
                              />
                              {event.type}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <CodeBlock
                              code={JSON.stringify(event, null, 2)}
                              language="json"
                              showLineNumbers={true}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
            <div className="col-span-8 h-full flex justify-center items-center">
              <Carousel
                images={events
                  .filter((event) => event.type === "screenshot")
                  .map(
                    (event) => (event.payload as { dataUrl: string }).dataUrl
                  )}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
