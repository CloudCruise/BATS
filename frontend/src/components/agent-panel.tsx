"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Bot, Play, Square, ChevronDown, ChevronRight } from "lucide-react";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { type AgentAction } from "@/agent/main-agent";

type AgentPanelProps = {
  currentUrl?: string;
  agentRunning: boolean;
  onAgentToggle: () => void;
  actions?: AgentAction[];
  uiMessages?: Array<{ id: string; role: 'assistant' | 'user'; parts: Array<{ type: string; text?: string }> }>;
};

export function AgentPanel({ currentUrl, agentRunning, onAgentToggle, actions = [], uiMessages = [] }: AgentPanelProps) {
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 flex flex-col min-h-0">
        {actions.length > 0 ? (
          <div className="flex-1 min-h-0">
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium text-foreground">Activity Feed</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {uiMessages.map((message) => (
                  <div key={message.id}>
                    <Reasoning defaultOpen={false} isStreaming={agentRunning}>
                      <ReasoningTrigger />
                      <ReasoningContent>
                        {message.parts.map((p) => p.text).filter(Boolean).join('\n') || 'Thinking...'}
                      </ReasoningContent>
                    </Reasoning>
                  </div>
                ))}
                {actions.map((action) => (
                  <div key={action.id}>
                    {action.type === 'reasoning' && (
                      <Reasoning defaultOpen={false} isStreaming={action.state === 'running'}>
                        <ReasoningTrigger />
                        <ReasoningContent>
                          {action.content || 'Thinking...'}
                        </ReasoningContent>
                      </Reasoning>
                    )}
                    {action.type === 'tool' && (
                      <Tool 
                        defaultOpen={true} 
                        state={action.state === 'running' ? 'running' : action.state === 'error' ? 'error' : 'completed'}
                      >
                        <ToolHeader 
                          toolType={action.toolName || 'unknown'} 
                          state={action.state === 'running' ? 'running' : action.state === 'error' ? 'error' : 'completed'}
                        />
                        <ToolContent>
                          {action.toolInput && <ToolInput input={action.toolInput} />}
                          {(action.toolOutput || action.toolError) && (
                            <ToolOutput 
                              output={action.toolOutput ? (typeof action.toolOutput === 'string' ? action.toolOutput : JSON.stringify(action.toolOutput)) : undefined}
                              errorText={action.toolError}
                            />
                          )}
                        </ToolContent>
                      </Tool>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 space-y-4">
            {!agentRunning && actions.length === 0 && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Objective</h3>
                  <p className="text-sm text-muted-foreground">
                    Disrupt browser automation with new buttons, moved buttons, and more.
                  </p>
                </div>

                <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto" type="button">
                      <h3 className="text-sm font-medium text-foreground">Available Tools</h3>
                      {toolsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2">
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <span className="font-mono">openPopup</span> - Open popups/modals by clicking elements
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <span className="font-mono">moveButton</span> - Reposition buttons to specific coordinates
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <span className="font-mono">insertButton</span> - Add new buttons with custom styling
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {currentUrl && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-foreground">Target Page</h3>
                    <p className="text-xs text-muted-foreground font-mono bg-muted/30 rounded p-2 break-all">
                      {currentUrl}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              {!agentRunning && <h3 className="text-sm font-medium text-foreground">Status</h3>}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${agentRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-muted-foreground">
                  {agentRunning ? 'Agent is running...' : 'Agent is idle'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="relative">
          <Button
            onClick={onAgentToggle}
            disabled={!currentUrl}
            className={`w-full relative ${agentRunning ? 'bg-red-600 hover:bg-red-700' : ''}`}
            variant={agentRunning ? "destructive" : "default"}
          >
            {agentRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Agent
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Agent
              </>
            )}
          </Button>
        </div>
        
        {!currentUrl && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Generate or select a website to enable Agent Mode
          </p>
        )}
      </div>
    </div>
  );
}
