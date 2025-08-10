import { openai } from "@ai-sdk/openai";
import { streamText, tool, type ModelMessage, createUIMessageStream, createUIMessageStreamResponse, stepCountIs } from "ai";
import { z } from "zod";
import { toolSchemas } from "@/agent/sub-agents";
import { fetchAndCompilePrompt } from "@/lib/langfuse";
export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, activeTools = [] } = (await req.json()) as {
      messages: ModelMessage[];
      activeTools?: string[];
    };
    const list = activeTools.length ? activeTools : Object.keys(toolSchemas);
    // Expose ONLY schemas (no execute) so the client executes tools
    const tools = Object.fromEntries(
      list
        .map((name) => {
          const schema = (toolSchemas as Record<string, z.ZodTypeAny>)[name] as z.ZodTypeAny | undefined;
          return schema ? [name, tool({ description: name, inputSchema: schema })] : null;
        })
        .filter(Boolean) as [string, ReturnType<typeof tool>][]
    );
    const systemPrompt = await fetchAndCompilePrompt("adverserial-agent");
    
    const stream = createUIMessageStream({
      async execute({ writer }) {
        const result = streamText({
          model: openai("gpt-5-mini"),
          tools,
          stopWhen: stepCountIs(5),
          toolChoice: 'auto',
          messages,
          system: systemPrompt,
        });
        writer.merge(result.toUIMessageStream());
      },
    });
    return createUIMessageStreamResponse({ stream });
  } catch {
    return new Response("", { status: 500 });
  }
}
