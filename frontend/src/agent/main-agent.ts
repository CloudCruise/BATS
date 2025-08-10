import { toolSchemas, buildToolsRegistry } from "./sub-agents";

export type AgentSnapshot = { html: string; inputs: Array<{ selector: string; value: string }> };

export class PageAgent {
  private iframe: HTMLIFrameElement;
  private win: Window | null = null;
  private tools = buildToolsRegistry();
  private removeNavGuards: (() => void) | null = null;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.attach(iframe);
  }

  attach(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.win = iframe.contentWindow;
  }

  dispose() {
    this.enableNavGuards(false);
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

  // Prevents in-iframe navigations (links, form submits, window.open, location changes)
  enableNavGuards(enable: boolean) {
    const win = this.win ?? this.iframe.contentWindow;
    if (!win) return;
    const doc = win.document;
    if (enable) {
      if (this.removeNavGuards) return; // already enabled
      const clickHandler = (event: Event) => {
        const target = event.target as Element | null;
        const nearest = (target as HTMLElement | null)?.closest?.bind(target as HTMLElement | null);
        const anchor = typeof nearest === 'function' ? nearest('a') as HTMLAnchorElement | null : null;
        if (anchor) {
          const href = anchor.getAttribute('href') ?? '';
          const isHashOnly = href.startsWith('#');
          const isJs = href.toLowerCase().startsWith('javascript:');
          if (!isHashOnly && !isJs) {
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
      };
      const submitHandler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
      };
      doc.addEventListener('click', clickHandler, true);
      doc.addEventListener('submit', submitHandler, true);

      const originalOpen = win.open.bind(win);
      // Block popups but do not override read-only Location methods (assign/replace)
      (win as unknown as { open: (...args: unknown[]) => Window | null }).open = () => null;
      // Optionally block history mutations that some scripts use instead of location
      const originalPushState = win.history.pushState.bind(win.history);
      const originalReplaceState = win.history.replaceState.bind(win.history);
      win.history.pushState = (() => {}) as typeof win.history.pushState;
      win.history.replaceState = (() => {}) as typeof win.history.replaceState;

      this.removeNavGuards = () => {
        doc.removeEventListener('click', clickHandler, true);
        doc.removeEventListener('submit', submitHandler, true);
        (win as unknown as { open: typeof originalOpen }).open = originalOpen;
        win.history.pushState = originalPushState;
        win.history.replaceState = originalReplaceState;
      };
      return;
    }
    if (this.removeNavGuards) {
      this.removeNavGuards();
      this.removeNavGuards = null;
    }
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
  private onUIMessages?: (messages: Array<{ id: string; role: 'assistant' | 'user'; parts: Array<{ type: string; text?: string }> }>) => void;
  private traceId: string | null = null;
  private executedToolCallKeys: Set<string> = new Set();

  constructor(page: PageAgent, continuous = false, onAction?: ActionCallback, onUIMessages?: (messages: Array<{ id: string; role: 'assistant' | 'user'; parts: Array<{ type: string; text?: string }> }>) => void) {
    this.page = page;
    this.continuous = continuous;
    this.onAction = onAction;
    this.onUIMessages = onUIMessages;
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
      
      // Always use streaming mode for agent
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: this.messages, activeTools: Object.keys(this.page.listToolSchemas()), traceId: this.traceId, iteration: i + 1 }),
        signal,
      }).catch(() => null);
      
      if (!res || !res.ok || !res.body) {
        this.onAction?.({
          id: reasoningId,
          type: 'reasoning',
          timestamp: new Date(),
          content: `Iteration ${i + 1}/${iterations}: Failed to get response from agent`,
          state: 'error'
        });
        break;
      }
      
      // Parse UI Message SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseBuffer = { text: '' } as { text: string };
      const MAX_REASONING_WORDS = 50;
      let reasoningAggregate = '';
      let reasoningCompleted = false;
      // minimal UI message buffer for the current iteration
      const uiMessages: Array<{ id: string; role: 'assistant' | 'user'; parts: Array<{ type: string; text?: string }> }> = [];
      const uiMsgId = `ui-${reasoningId}`;
      uiMessages.push({ id: uiMsgId, role: 'assistant', parts: [] });
      const pushOrReplacePart = (type: string, text: string) => {
        const m = uiMessages[0];
        const last = m.parts[m.parts.length - 1];
        if (last && last.type === type) {
          last.text = text;
        } else {
          m.parts.push({ type, text });
        }
        this.onUIMessages?.(uiMessages);
      };

      const windowText = (text: string) => {
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length <= MAX_REASONING_WORDS) return words.join(' ');
        return words.slice(words.length - MAX_REASONING_WORDS).join(' ');
      };

      const extractPreamble = (raw: string): string => {
        if (!raw) return '';
        const textNorm = raw.replace(/\r/g, '');
        
        // Try XML-style preamble tags first
        const xmlMatch = textNorm.match(/<preamble>\s*([\s\S]*?)\s*<\/preamble>/i);
        if (xmlMatch && xmlMatch[1]) {
          return xmlMatch[1].trim();
        }
        
        // Fallback to old format for backward compatibility
        const byHeaders = textNorm.match(/(?:^|\n)\s*(?:1\)\s*)?PREAMBLE\s*:?\s*\n([\s\S]*?)(?:\n\s*(?:2\)\s*)?HTML\b)/i);
        let out = '';
        if (byHeaders && byHeaders[1]) {
          out = byHeaders[1];
        } else {
          const idx = textNorm.search(/<!doctype html>|<html[\s>]/i);
          if (idx > 0) out = textNorm.slice(0, idx);
        }
        return out
          .split('\n')
          .filter((line) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(line))
          .join('\n')
          .replace(/\n\s*\n+/g, '\n')
          .trim();
      };

      const parseToolCalls = (raw: string): Array<{ name: string; args: unknown; key: string }> => {
        const results: Array<{ name: string; args: unknown; key: string }> = [];
        if (!raw) return results;
        
        // Extract tool calls from HTML section if using new format
        const textNorm = raw.replace(/\r/g, '');
        const htmlMatch = textNorm.match(/<html>\s*([\s\S]*?)(?:<\/html>|$)/i);
        const searchText = htmlMatch ? htmlMatch[1] : raw;
        
        const re = /<tool_call>\s*([\s\S]*?)<\/tool_call>/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(searchText)) !== null) {
          const block = m[1] ?? '';
          const nameMatch = block.match(/<name>\s*([^<]+?)\s*<\/name>/i);
          const argsMatch = block.match(/<arguments>\s*([\s\S]*?)\s*<\/arguments>/i);
          const name = nameMatch ? nameMatch[1].trim() : '';
          let args: unknown = {};
          try {
            args = argsMatch ? JSON.parse(argsMatch[1]) : {};
          } catch {
            args = {};
          }
          const key = `${name}:${JSON.stringify(args)}`;
          results.push({ name, args, key });
        }
        return results;
      };

      const isPreambleComplete = (raw: string): boolean => {
        if (!raw) return false;
        const textNorm = raw.replace(/\r/g, '');
        
        // Check if we have a complete preamble XML tag
        const hasCompletePreamble = /<preamble>\s*[\s\S]*?\s*<\/preamble>/i.test(textNorm);
        if (hasCompletePreamble) return true;
        
        // Fallback: check for old format patterns
        const hasHtmlSection = /(?:\n\s*(?:2\)\s*)?HTML\b|<!doctype html>|<html[\s>])/i.test(textNorm);
        return hasHtmlSection;
      };

      const parseSSELines = (chunk: string, buffer: { text: string }) => {
        buffer.text += chunk;
        const events: string[] = [];
        let idx: number;
        while ((idx = buffer.text.indexOf('\n\n')) !== -1) {
          const raw = buffer.text.slice(0, idx).trim();
          buffer.text = buffer.text.slice(idx + 2);
          const dataLines = raw.split('\n').filter(l => l.startsWith('data:'));
          if (!dataLines.length) continue;
          const data = dataLines.map(l => l.slice(5).trim()).join('');
          if (data && data !== '[DONE]') events.push(data);
        }
        return events;
      };
      while (this.running && !signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const frames = parseSSELines(text, sseBuffer);
        for (const frame of frames) {
          try {
            const part = JSON.parse(frame) as { type: string; [k: string]: unknown };
            // Handle reasoning text deltas
            if (part.type === 'text-delta' && typeof part.delta === 'string') {
              // Aggregate deltas and show a capped sliding window to avoid one-word flicker
              reasoningAggregate += part.delta;
              const preamble = extractPreamble(reasoningAggregate);
              const view = preamble || windowText(reasoningAggregate);
              
              // Check if preamble is complete and mark reasoning as completed
              if (!reasoningCompleted && isPreambleComplete(reasoningAggregate)) {
                reasoningCompleted = true;
                this.onAction?.({ id: reasoningId, type: 'reasoning', timestamp: new Date(), content: view, state: 'completed' });
                pushOrReplacePart('reasoning', view);
              } else if (!reasoningCompleted) {
                this.onAction?.({ id: reasoningId, type: 'reasoning', timestamp: new Date(), content: view, state: 'running' });
                pushOrReplacePart('reasoning', view);
              }
              
              // Try to parse tool calls as they appear
              const calls = parseToolCalls(reasoningAggregate);
              for (const call of calls) {
                if (this.executedToolCallKeys.has(call.key) || !call.name) continue;
                const toolId = `tool-${i}-${Date.now()}-${this.executedToolCallKeys.size}`;
                this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName: call.name, toolInput: call.args as Record<string, unknown>, state: 'running' });
                try {
                  const output = await this.page.runTool(call.name, call.args);
                  this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName: call.name, toolInput: call.args as Record<string, unknown>, toolOutput: output as Record<string, unknown>, state: 'completed' });
                  this.messages.push({ role: 'assistant', content: [{ type: 'tool-call', toolCallId: toolId, toolName: call.name, input: call.args }] });
                  this.messages.push({ role: 'tool', content: [{ type: 'tool-result', toolCallId: toolId, toolName: call.name, output }] });
                  this.executedToolCallKeys.add(call.key);
                } catch (err) {
                  this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName: call.name, toolInput: call.args as Record<string, unknown>, toolError: err instanceof Error ? err.message : 'Unknown error', state: 'error' });
                  this.executedToolCallKeys.add(call.key);
                }
              }
            }
            if (part.type === 'text') {
              // Finalize with the full aggregated text (still capped to a window for display)
              if (typeof part.text === 'string' && part.text.length > 0) {
                reasoningAggregate = part.text;
              }
              const preamble = extractPreamble(reasoningAggregate);
              const view = preamble || windowText(reasoningAggregate);
              
              // Only complete reasoning if not already completed
              if (!reasoningCompleted) {
                reasoningCompleted = true;
                this.onAction?.({ id: reasoningId, type: 'reasoning', timestamp: new Date(), content: view, state: 'completed' });
                pushOrReplacePart('text', view);
              }
              
              // Parse any final tool calls and execute
              const calls = parseToolCalls(reasoningAggregate);
              for (const call of calls) {
                if (this.executedToolCallKeys.has(call.key) || !call.name) continue;
                const toolId = `tool-${i}-${Date.now()}-${this.executedToolCallKeys.size}`;
                this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName: call.name, toolInput: call.args as Record<string, unknown>, state: 'running' });
                try {
                  const output = await this.page.runTool(call.name, call.args);
                  this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName: call.name, toolInput: call.args as Record<string, unknown>, toolOutput: output as Record<string, unknown>, state: 'completed' });
                  this.messages.push({ role: 'assistant', content: [{ type: 'tool-call', toolCallId: toolId, toolName: call.name, input: call.args }] });
                  this.messages.push({ role: 'tool', content: [{ type: 'tool-result', toolCallId: toolId, toolName: call.name, output }] });
                  this.executedToolCallKeys.add(call.key);
                } catch (err) {
                  this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName: call.name, toolInput: call.args as Record<string, unknown>, toolError: err instanceof Error ? err.message : 'Unknown error', state: 'error' });
                  this.executedToolCallKeys.add(call.key);
                }
              }
            }
            // Handle tool calls when input is ready
            if (part.type === 'tool-input-available') {
              const toolName = String(part.toolName ?? '');
              const input = part.input as Record<string, unknown> | string | number | boolean | null;
              const toolCallId = String(part.toolCallId ?? `${Date.now()}`);
              const toolId = `tool-${i}-${toolCallId}`;
              this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName, toolInput: input, state: 'running' });
              try {
                const output = await this.page.runTool(toolName, input);
                this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName, toolInput: input, toolOutput: output as Record<string, unknown> | string | number | boolean | null, state: 'completed' });
                this.messages.push({ role: 'assistant', content: [{ type: 'tool-call', toolCallId, toolName, input }] });
                this.messages.push({ role: 'tool', content: [{ type: 'tool-result', toolCallId, toolName, output }] });
                // Optionally, POST tool result if server session requires it
                // await fetch('/api/agent/tool-result', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ toolCallId, toolName, output, traceId: this.traceId }) }).catch(() => null);
              } catch (err) {
                this.onAction?.({ id: toolId, type: 'tool', timestamp: new Date(), toolName, toolInput: input, toolError: err instanceof Error ? err.message : 'Unknown error', state: 'error' });
              }
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
      
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
