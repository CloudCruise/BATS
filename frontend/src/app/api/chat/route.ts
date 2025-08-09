import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { fetchAndCompilePrompt } from '@/lib/langfuse';
import { randomUUID } from 'crypto';

// Using Langfuse prompt management via helper for text prompts

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Create a trace for this chat session
    const traceId = randomUUID();
    console.log('calling gpt5 with traceId: ', traceId);
    
    const systemPrompt = await fetchAndCompilePrompt("edit-website").catch(() =>
      `You are a helpful AI assistant specialized in web development and HTML/CSS/JavaScript. When provided with HTML content, you can analyze it and suggest improvements, modifications, or fixes. 

IMPORTANT: When responding to questions about HTML content:
1. Provide concise summaries of changes rather than outputting full HTML code
2. Focus on explaining WHAT changes you would make and WHY
3. Only include small, relevant code snippets when necessary for clarity
4. Avoid repeating large blocks of HTML unless specifically requested
5. Structure your responses to be conversational and helpful

Always provide clear, practical advice and focus on the key improvements or modifications needed.`
    );

    // Note: if using Langfuse tracing, wire it here with your preferred client

    const result = await streamText({
      model: openai('gpt-5-mini'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'chat',
        metadata: {
          langfuseTraceId: traceId,
        },
      }
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onFinish: () => {},
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 