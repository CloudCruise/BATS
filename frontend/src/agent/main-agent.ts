import { toolSchemas, buildToolsRegistry } from "./sub-agents";

export type AgentSnapshot = { html: string; inputs: Array<{ selector: string; value: string }> };

export class PageAgent {
  private iframe: HTMLIFrameElement;
  private win: Window | null = null;
  private tools = buildToolsRegistry();

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.attach(iframe);
  }

  attach(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.win = iframe.contentWindow;
  }

  dispose() {
    this.win = null;
  }

  listToolSchemas() {
    return toolSchemas;
  }

  async snapshot(): Promise<AgentSnapshot> {
    const win = this.ensureWindow();
    const doc = win.document;
    const html = doc.documentElement.outerHTML;
    const inputs: AgentSnapshot["inputs"] = [];
    const fields = doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select");
    fields.forEach((el, idx) => {
      const value = el instanceof HTMLSelectElement ? el.value : (el as HTMLInputElement | HTMLTextAreaElement).value ?? "";
      const selector = this.getStableSelector(el) ?? `:agent-field-${idx}`;
      inputs.push({ selector, value });
    });
    return { html, inputs };
  }

  async runTool(name: string, args: unknown) {
    const tool = this.tools[name];
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    const win = this.ensureWindow();
    const doc = win.document;
    return tool.run({ win, doc, getStableSelector: this.getStableSelector }, args);
  }

  private ensureWindow(): Window {
    const win = this.win ?? this.iframe.contentWindow;
    if (!win) throw new Error("Iframe window is not ready");
    return win;
  }

  private getStableSelector = (el: Element): string | null => {
    const id = (el as HTMLElement).id;
    if (id) return `#${id}`;
    const dtid = el.getAttribute("data-testid");
    if (dtid) return `[data-testid="${dtid}"]`;
    const name = (el as HTMLElement).getAttribute("name");
    if (name) return `[name="${name}"]`;
    return this.cssPath(el);
  };

  private cssPath(el: Element) {
    const path: string[] = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      const id = (el as HTMLElement).id;
      if (id) {
        selector += `#${id}`;
        path.unshift(selector);
        break;
      } else {
        let sib: Element | null = el;
        let nth = 1;
        while ((sib = (sib?.previousElementSibling as Element))) {
          if (sib.nodeName.toLowerCase() === selector) nth++;
        }
        selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentElement as Element;
    }
    return path.join(" > ");
  }
}

type ToolCall = { toolName: string; toolCallId: string; input: unknown };

export type AgentAction = {
  id: string;
  type: 'reasoning' | 'tool';
  timestamp: Date;
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown> | string | number | boolean | null;
  toolOutput?: Record<string, unknown> | string | number | boolean | null;
  toolError?: string;
  state: 'running' | 'completed' | 'error';
};

type ActionCallback = (action: AgentAction) => void;

export class AgentRunner {
  private page: PageAgent;
  private abortController: AbortController | null = null;
  private running = false;
  private messages: Array<{ role: string; content: string | Array<{ type: string; toolCallId?: string; toolName?: string; input?: unknown; output?: unknown }> }> = [];
  private continuous = false;
  private onAction?: ActionCallback;
  private traceId: string | null = null;

  constructor(page: PageAgent, continuous = false, onAction?: ActionCallback) {
    this.page = page;
    this.continuous = continuous;
    this.onAction = onAction;
  }

  async runOnce(objective: string) {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    // Initialize a trace id for this run so all steps are grouped in Langfuse
    if (!this.traceId) {
      try {
        // Use browser crypto when available, fallback to timestamp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyCrypto = (globalThis as any).crypto as { randomUUID?: () => string } | undefined;
        this.traceId = anyCrypto?.randomUUID ? anyCrypto.randomUUID() : `trace_${Date.now()}`;
      } catch {
        this.traceId = `trace_${Date.now()}`;
      }
    }
    const snap = await this.page.snapshot();
    this.messages = [
      { role: "user", content: `Objective: ${objective}\n\nSnapshot:\n${snap.html.slice(0, 40000)}` },
    ];
    
    // Emit reasoning action
    const reasoningId = `reasoning-${Date.now()}`;
    this.onAction?.({
      id: reasoningId,
      type: 'reasoning',
      timestamp: new Date(),
      content: 'Analyzing the current page structure and identifying areas for improvement...',
      state: 'running'
    });
    
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: this.messages, activeTools: Object.keys(this.page.listToolSchemas()), traceId: this.traceId, iteration: 1 }),
      signal,
    });
    
    if (!res.ok) {
      this.onAction?.({
        id: reasoningId,
        type: 'reasoning',
        timestamp: new Date(),
        content: 'Failed to get response from agent',
        state: 'error'
      });
      return;
    }
    
    const data = (await res.json()) as { toolCalls?: ToolCall[]; text?: string };
    
    // Complete reasoning
    this.onAction?.({
      id: reasoningId,
      type: 'reasoning',
      timestamp: new Date(),
      content: data.text || 'Analysis complete. Executing tools...',
      state: 'completed'
    });
    
    const calls = data.toolCalls ?? [];
    for (const call of calls) {
      const toolId = `tool-${call.toolCallId || Date.now()}`;
      
      // Emit tool start
      this.onAction?.({
        id: toolId,
        type: 'tool',
        timestamp: new Date(),
        toolName: call.toolName,
        toolInput: call.input as Record<string, unknown> | string | number | boolean | null,
        state: 'running'
      });
      
      try {
        const output = await this.page.runTool(call.toolName, call.input);
        
        // Emit tool completion
        this.onAction?.({
          id: toolId,
          type: 'tool',
          timestamp: new Date(),
          toolName: call.toolName,
          toolInput: call.input as Record<string, unknown> | string | number | boolean | null,
          toolOutput: output as Record<string, unknown> | string | number | boolean | null,
          state: 'completed'
        });
      } catch (error) {
        // Emit tool error
        this.onAction?.({
          id: toolId,
          type: 'tool',
          timestamp: new Date(),
          toolName: call.toolName,
          toolInput: call.input as Record<string, unknown> | string | number | boolean | null,
          toolError: error instanceof Error ? error.message : 'Unknown error',
          state: 'error'
        });
      }
    }
  }

  async runIterations(objective: string, iterations = 3) {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.running = true;
    // Initialize a trace id for this run
    if (!this.traceId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyCrypto = (globalThis as any).crypto as { randomUUID?: () => string } | undefined;
        this.traceId = anyCrypto?.randomUUID ? anyCrypto.randomUUID() : `trace_${Date.now()}`;
      } catch {
        this.traceId = `trace_${Date.now()}`;
      }
    }
    
    for (let i = 0; i < iterations && this.running && !signal.aborted; i++) {
      const iterationObjective = i === 0 
        ? objective 
        : `Continue with objective: ${objective}. This is iteration ${i + 1} of ${iterations}.`;
      
      const snap = await this.page.snapshot();
      this.messages = [
        { role: "user", content: `Objective: ${iterationObjective}\n\nSnapshot:\n${snap.html.slice(0, 40000)}` },
      ];
      
      // Emit reasoning action for this iteration
      const reasoningId = `reasoning-${i}-${Date.now()}`;
      this.onAction?.({
        id: reasoningId,
        type: 'reasoning',
        timestamp: new Date(),
        content: `Iteration ${i + 1}/${iterations}: Analyzing current state and planning next actions...`,
        state: 'running'
      });
      
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: this.messages, activeTools: Object.keys(this.page.listToolSchemas()), traceId: this.traceId, iteration: i + 1 }),
        signal,
      }).catch(() => null);
      
      if (!res || !res.ok) {
        this.onAction?.({
          id: reasoningId,
          type: 'reasoning',
          timestamp: new Date(),
          content: `Iteration ${i + 1}/${iterations}: Failed to get response from agent`,
          state: 'error'
        });
        break;
      }
      
      const data = (await res.json()) as { toolCalls?: ToolCall[]; text?: string };
      
      // Complete reasoning
      this.onAction?.({
        id: reasoningId,
        type: 'reasoning',
        timestamp: new Date(),
        content: data.text || `Iteration ${i + 1}/${iterations}: Analysis complete. Executing ${data.toolCalls?.length || 0} tools...`,
        state: 'completed'
      });
      
      const calls = data.toolCalls ?? [];
      if (calls.length === 0) {
        // No more actions to take
        break;
      }
      
      // Execute tool calls concurrently
      await Promise.all(calls.map(async (call, idx) => {
        if (!this.running || signal.aborted) return;
        const toolId = `tool-${i}-${call.toolCallId || Date.now()}-${idx}`;
        this.onAction?.({
          id: toolId,
          type: 'tool',
          timestamp: new Date(),
          toolName: call.toolName,
          toolInput: call.input as Record<string, unknown> | string | number | boolean | null,
          state: 'running'
        });
        try {
          const output = await this.page.runTool(call.toolName, call.input);
          this.onAction?.({
            id: toolId,
            type: 'tool',
            timestamp: new Date(),
            toolName: call.toolName,
            toolInput: call.input as Record<string, unknown> | string | number | boolean | null,
            toolOutput: output as Record<string, unknown> | string | number | boolean | null,
            state: 'completed'
          });
          this.messages.push({ role: "assistant", content: [{ type: "tool-call", toolCallId: call.toolCallId, toolName: call.toolName, input: call.input }] });
          this.messages.push({ role: "tool", content: [{ type: "tool-result", toolCallId: call.toolCallId, toolName: call.toolName, output }] });
        } catch (error) {
          this.onAction?.({
            id: toolId,
            type: 'tool',
            timestamp: new Date(),
            toolName: call.toolName,
            toolInput: call.input as Record<string, unknown> | string | number | boolean | null,
            toolError: error instanceof Error ? error.message : 'Unknown error',
            state: 'error'
          });
        }
      }));
      
      // Small delay between iterations
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    this.running = false;
  }

  async runLoop(objective: string) {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.running = true;
    const snap = await this.page.snapshot();
    this.messages = [
      { role: "user", content: `Objective: ${objective}\n\nSnapshot:\n${snap.html.slice(0, 40000)}` },
    ];
    while (this.running && !signal.aborted) {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: this.messages, activeTools: Object.keys(this.page.listToolSchemas()) }),
        signal,
      }).catch(() => null);
      if (!res || !res.ok) break;
      const data = (await res.json()) as { toolCalls?: ToolCall[]; text?: string };
      const calls = data.toolCalls ?? [];
      if (calls.length === 0) break;
      for (const call of calls) {
        const output = await this.page.runTool(call.toolName, call.input);
        this.messages.push({ role: "assistant", content: [{ type: "tool-call", toolCallId: call.toolCallId, toolName: call.toolName, input: call.input }] });
        this.messages.push({ role: "tool", content: [{ type: "tool-result", toolCallId: call.toolCallId, toolName: call.toolName, output }] });
      }
    }
    this.running = false;
  }

  abort() {
    this.running = false;
    this.abortController?.abort();
    this.abortController = null;
  }
}
