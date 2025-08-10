import { z } from "zod";

export type ToolContext = { win: Window; doc: Document; getStableSelector: (el: Element) => string | null };
export type Tool<T = unknown> = { name: string; description: string; inputSchema: z.ZodTypeAny; run: (ctx: ToolContext, args: T) => Promise<unknown> };
export type ToolsRegistry = Record<string, Tool>;

function findClickable(doc: Document, selector?: string): HTMLElement | null {
  if (selector) {
    const el = doc.querySelector<HTMLElement>(selector);
    return el ?? null;
  }
  const candidates = ['[data-testid*="popup"]', '[aria-haspopup="true"]', 'button', '[role="button"]'];
  for (const sel of candidates) {
    const el = doc.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

function addAgentHighlight(element: HTMLElement, options: { timeout?: number } = {}): void {
  // Add red highlighting to show agent interaction
  element.style.outline = "3px solid red";
  element.style.outlineOffset = "2px";
  
  // Optionally remove highlighting after timeout (default 10 seconds)
  if (options.timeout !== 0) {
    const timeoutMs = options.timeout ?? 10000;
    setTimeout(() => {
      element.style.outline = "";
      element.style.outlineOffset = "";
    }, timeoutMs);
  }
}

export const openPopupSchema = z.object({ selector: z.string().optional() });
export const moveButtonSchema = z.object({ selector: z.string(), x: z.number(), y: z.number() });
export const insertButtonSchema = z.object({
  targetSelector: z.string().optional(),
  text: z.string().optional(),
  id: z.string().optional(),
  className: z.string().optional(),
});

export const openPopup: Tool<z.infer<typeof openPopupSchema>> = {
  name: "openPopup",
  description: "Open a popup or modal by clicking an element.",
  inputSchema: openPopupSchema,
  async run({ doc }, args: z.infer<typeof openPopupSchema>) {
    const el = findClickable(doc, args?.selector);
    if (!el) throw new Error("No clickable element found");
    
    // Add red highlighting to show which element was clicked
    addAgentHighlight(el);
    
    el.click();
    return { clicked: true, selector: el.id ? `#${el.id}` : el.tagName.toLowerCase() };
  },
};

export const moveButton: Tool<z.infer<typeof moveButtonSchema>> = {
  name: "moveButton",
  description: "Move a button to an absolute position.",
  inputSchema: moveButtonSchema,
  async run({ doc }, args: z.infer<typeof moveButtonSchema>) {
    const el = doc.querySelector<HTMLElement>(args.selector);
    if (!el) throw new Error(`Not found: ${args.selector}`);
    const s = el.style;
    s.position = "absolute";
    s.left = `${Math.round(args.x)}px`;
    s.top = `${Math.round(args.y)}px`;
    s.zIndex = "1000";
    
    // Add permanent red highlighting to show which element was moved by agent
    el.setAttribute("data-agent-moved", "true");
    addAgentHighlight(el, { timeout: 0 });
    
    // Compute numeric coordinates after layout
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + (doc.defaultView?.scrollX ?? 0));
    const y = Math.round(rect.top + (doc.defaultView?.scrollY ?? 0));
    return { moved: true, left: s.left, top: s.top, x, y, width: Math.round(rect.width), height: Math.round(rect.height), selector: args.selector };
  },
};

export const insertButton: Tool<z.infer<typeof insertButtonSchema>> = {
  name: "insertButton",
  description: "Insert a button with text and optional id/class into a target container.",
  inputSchema: insertButtonSchema,
  async run({ doc }, args: z.infer<typeof insertButtonSchema>) {
    const parent = (args.targetSelector && doc.querySelector<HTMLElement>(args.targetSelector)) || doc.body || doc.documentElement;
    const btn = doc.createElement("button");
    btn.textContent = args.text ?? "Click me";
    if (args.id) btn.id = args.id;
    if (args.className) btn.className = args.className;
    btn.setAttribute("data-testid", args.id ?? "inserted-button");
    btn.setAttribute("data-agent-inserted", "true");
    
    // Add permanent red highlighting to identify agent-inserted elements
    addAgentHighlight(btn, { timeout: 0 });
    
    // Prevent the outline from being removed even if the button is clicked or styled
    const maintainHighlight = () => {
      btn.style.outline = "3px solid red";
      btn.style.outlineOffset = "2px";
    };
    
    btn.addEventListener('click', maintainHighlight);
    btn.addEventListener('focus', maintainHighlight);
    btn.addEventListener('blur', maintainHighlight);
    
    parent.appendChild(btn);
    // Compute numeric coordinates after insertion
    const rect = btn.getBoundingClientRect();
    const x = Math.round(rect.left + (doc.defaultView?.scrollX ?? 0));
    const y = Math.round(rect.top + (doc.defaultView?.scrollY ?? 0));
    return { inserted: true, x, y, width: Math.round(rect.width), height: Math.round(rect.height), selector: btn.id ? `#${btn.id}` : '[data-testid="inserted-button"]' };
  },
};

export const toolList = [openPopup, moveButton, insertButton] as const;
export const toolSchemas = { openPopup: openPopupSchema, moveButton: moveButtonSchema, insertButton: insertButtonSchema };

export function buildToolsRegistry(): ToolsRegistry {
  return toolList.reduce((acc, t) => {
    acc[t.name] = t as Tool;
    return acc;
  }, {} as ToolsRegistry);
}
