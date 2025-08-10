import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";
import { toolSchemas } from "@/agent/sub-agents";
import { fetchAndCompilePrompt } from "@/lib/langfuse";
import { Langfuse } from "langfuse";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages, activeTools, traceId, iteration } = (await req.json()) as {
      messages: ModelMessage[];
      activeTools?: string[];
      traceId?: string;
      iteration?: number;
    };
    const list = activeTools ?? Object.keys(toolSchemas);
    const tools = Object.fromEntries(
      list
        .map((name) => {
          const schema = (toolSchemas as Record<string, z.ZodTypeAny>)[name] as z.ZodTypeAny | undefined;
          return schema ? [name, tool({ description: name, inputSchema: schema })] : null;
        })
        .filter(Boolean) as [string, ReturnType<typeof tool>][]
    );
    const systemPrompt = await fetchAndCompilePrompt("adverserial-agent");
    
    // Langfuse tracing: one trace per agent run, one generation per API step
    const langfuse = new Langfuse();
    const trace = langfuse.trace({
      id: traceId,
      name: "agent-step",
      input: { messages, activeTools, iteration },
      metadata: { source: "agent-mode" },
    });
    const generation = trace.generation({
      name: "agent-llm",
      model: "gpt-5-mini",
      input: { messages, systemPrompt },
    });
    
    const { text, toolCalls, response } = await generateText({
      model: openai("gpt-5-mini"),
      tools,
      stopWhen: stepCountIs(1),
      messages,
      system: systemPrompt,
    });
    await generation.end({
      output: { text, toolCalls, responseMessages: response.messages },
    });
    await trace.update({ output: { text, toolCalls } });
    await langfuse.shutdownAsync();
    
    return new Response(JSON.stringify({ text, toolCalls, responseMessages: response.messages, traceId: trace.id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    try {
      const langfuse = new Langfuse();
      langfuse.trace({ name: "agent-step", input: { error: String(error) } });
      await langfuse.shutdownAsync();
    } catch {
      // ignore tracing failure
    }
    return new Response(JSON.stringify({ text: "", toolCalls: [] }), { status: 200, headers: { "content-type": "application/json" } });
  }
}
