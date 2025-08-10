"use client";
import { SidebarInset } from "@/components/sidebar-inset";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Run } from "@/types/run";

export function SuccessContent({ runId }: { runId: string }) {
  const [run, setRun] = useState<Run | null>(null);
  const [events, setEvents] = useState<
    { type: string; payload: unknown; ts_ms: number }[]
  >([]);
  const [copied, setCopied] = useState(false);

  // Load in the data from the backend to show the time taken and number of events
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/runs/${runId}`);
      const data = await res.json();
      setRun(data.run);
      setEvents(data.events);
    };
    if (runId) {
      fetchData();
    }
  }, [runId]);

  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copied]);

  return (
    <SidebarInset>
      <div className="flex w-full flex-col gap-8 p-8 justify-center items-center h-full">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white/5 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Success Icon */}
              <div className="relative">
                <div className="w-20 h-20  rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Test Completed!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Your test has finished successfully
                </p>
              </div>

              {run && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Time taken:{" "}
                      {new Date(run?.finishedAt || 0).getTime() -
                        new Date(run?.startedAt || 0).getTime()}
                      ms
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Number of events: {events.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Run Details */}
              <div className="w-full space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-start text-sm font-medium flex">
                      Run ID
                    </div>
                    <div>
                      <button
                        className="flex-1 text-sm text-gray-500 dark:text-gray-400 flex items-center"
                        onClick={() => {
                          navigator.clipboard.writeText(runId);
                          setCopied(true);
                        }}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        {copied ? "Copied!" : "Copy ID"}
                      </button>
                    </div>
                  </div>
                  {runId && (
                    <p className="text-xs  font-mono break-all">{runId}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.close()}
                  >
                    Close Window
                  </Button>
                  {runId && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        window.open(`/runs/${runId}`, "_blank");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Details View
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
