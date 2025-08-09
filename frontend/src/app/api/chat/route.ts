import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { Langfuse } from 'langfuse';
import { randomUUID } from 'crypto';

const langfuse = new Langfuse();

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Create a trace for this chat session
    const traceId = randomUUID();
    
    const systemPrompt = "You are a helpful AI assistant. Provide clear, helpful, and accurate responses to user questions.";

    // Create a Langfuse trace
    langfuse.trace({
      id: traceId,
      name: 'chat-session',
      metadata: {
        messageCount: messages.length,
      },
      tags: ['chat'],
    });

    const result = await streamText({
      model: openai('gpt-5-nano'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat',
        metadata: {
          langfuseTraceId: traceId,
        },
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: () => {
        langfuse.flushAsync().catch(console.error);
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 