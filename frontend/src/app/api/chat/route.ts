import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { fetchAndCompilePrompt } from "@/lib/langfuse";
import { randomUUID } from "crypto";

// Using Langfuse prompt management via helper for text prompts

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Create a trace for this chat session
    const traceId = randomUUID();
    console.log("calling gpt5 with traceId: ", traceId);

    const systemPrompt = await fetchAndCompilePrompt("edit-website");

    // Note: if using Langfuse tracing, wire it here with your preferred client

    const result = await streamText({
      model: openai("gpt-5-mini"),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "chat",
        metadata: {
          langfuseTraceId: traceId,
        },
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onFinish: () => {},
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
