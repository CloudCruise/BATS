import { streamText, tool, type ModelMessage, type UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { toolSchemas } from "@/agent/sub-agents";
import { fetchAndCompilePrompt } from "@/lib/langfuse";
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages: incomingMessages, activeTools }: { messages: UIMessage[] | ModelMessage[]; activeTools?: string[] } = await req.json();
    const list = activeTools && activeTools.length ? activeTools : Object.keys(toolSchemas);
    const tools = Object.fromEntries(
      list
        .map((name) => {
          const schema = (toolSchemas as Record<string, z.ZodTypeAny>)[name] as z.ZodTypeAny | undefined;
          return schema ? [name, tool({ description: name, inputSchema: schema })] : null;
        })
        .filter(Boolean) as [string, ReturnType<typeof tool>][]
    );
    const systemPrompt = await fetchAndCompilePrompt("adverserial-agent");

    const modelMessages: ModelMessage[] = Array.isArray(incomingMessages) && (incomingMessages as (UIMessage | ModelMessage)[])[0] && 'parts' in (incomingMessages as (UIMessage | ModelMessage)[])[0]!
      ? convertToModelMessages(incomingMessages as UIMessage[])
      : (incomingMessages as ModelMessage[]);

    const result = await streamText({
      model: openai('gpt-5-mini'),
      tools,
      stopWhen: stepCountIs(3),
      toolChoice: 'auto',
      messages: modelMessages,
      experimental_telemetry: { isEnabled: true },
      system: systemPrompt,
    });

    return result.toUIMessageStreamResponse({ sendReasoning: true });
  } catch (err) {
    console.error('Agent API error:', err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
