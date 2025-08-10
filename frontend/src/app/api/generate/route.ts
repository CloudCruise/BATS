import { mkdir, writeFile, readdir, stat, unlink, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetchAndCompilePrompt } from "@/lib/langfuse";
import {
  extractDescription,
  extractDescriptionSummary,
  extractHtmlOnly,
  extractName,
} from "@/utils/extracts";
import { TestCase } from "@/types/testcase";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const id = randomUUID();
  try {
    const body = await req.json();
    console.log("body1", JSON.stringify(body, null, 2));

    // Handle both direct generation and UIMessage format
    const { messages, prompt } = body;

    if (messages) {
      // Convert UIMessages to ModelMessages and extract the prompt data
      const lastUserMessage = messages
        .filter((msg: { role: string }) => msg.role === "user")
        .pop();

      let messageText = "";
      if (lastUserMessage?.parts) {
        // This is a UIMessage with parts
        const textPart = lastUserMessage.parts.find(
          (part: { type: string }) => part.type === "text"
        );
        messageText = textPart?.text || "";
      } else {
        // This is already in the correct format
        messageText = lastUserMessage?.content || "";
      }

      // Check if the message is JSON-formatted (new format)
      try {
        const parsed = JSON.parse(messageText);
        if (parsed.prompt) {
          messageText = parsed.prompt;
        }
      } catch {
        // Not JSON, use the text as is
      }

      // Create system prompt
      const systemPrompt = await createSystemPrompt();

      // Create a simple user message with the extracted prompt
      const modelMessages = [{ role: "user" as const, content: messageText }];

      const result = await streamText({
        model: openai("gpt-5-mini"),
        system: systemPrompt,
        messages: modelMessages,
        experimental_telemetry: { isEnabled: true },
        onFinish: async (result) => {
          // Extract and save HTML from the final result
          await saveGeneratedHtml(result.text, id);
          await saveGeneratedTestCase(result.text, id);
        },
        providerOptions: {
          openai: {
            reasoningEffort: "medium",
            textVerbosity: "medium",
          },
        },
      });

      return result.toUIMessageStreamResponse({
        sendReasoning: true,
      });
    }

    // Handle direct generation request
    if (prompt) {
      const systemPrompt = await createSystemPrompt();
      const userPrompt = `Create an HTML test page for the following scenario. The page should contain clear interactive elements with stable selectors (ids or data-testid) and at least one non-deterministic or delayed UI event (like a popup or modal). Scenario: ${prompt}`;

      const result = await streamText({
        model: openai("gpt-5-mini"),
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        experimental_telemetry: { isEnabled: true },
        onFinish: async (result) => {
          // Extract and save HTML from the final result
          await saveGeneratedHtml(result.text, id);
          await saveGeneratedTestCase(result.text, id);
        },
        providerOptions: {
          openai: {
            reasoningEffort: "medium",
            textVerbosity: "medium",
          },
        },
      });

      return result.toUIMessageStreamResponse({
        sendReasoning: true,
      });
    }

    throw new Error("No prompt or messages provided");
  } catch (error) {
    console.error("/api/generate error", error);
    return new Response(JSON.stringify({ error: "Failed to generate" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

async function createSystemPrompt() {
  return await fetchAndCompilePrompt("generate-website-v2");
}

async function saveGeneratedHtml(text: string, id: string) {
  try {
    const htmlContent = extractHtmlOnly(text);

    if (htmlContent) {
      const dir = path.join(process.cwd(), "public", "generated_websites");
      const filePath = path.join(dir, `${id}.html`);

      await mkdir(dir, { recursive: true });
      await writeFile(filePath, htmlContent, "utf8");

      console.log(`Generated website saved to: /generated_websites/${id}.html`);
      return `/generated_websites/${id}.html`;
    }
  } catch (error) {
    console.error("Failed to save generated HTML:", error);
  }
  return null;
}

async function saveGeneratedTestCase(text: string, id: string) {
  // Save the test cases to an file
  const dir = path.join(process.cwd(), "public", "generated_test_cases");
  const filePath = path.join(dir, `${id}.json`);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, text, "utf8");

  const testCase: TestCase = {
    id,
    name: extractName(text),
    description: extractDescription(text),
    summary: extractDescriptionSummary(text),
    html: text,
    createdAt: new Date(),
    pageUrl: `/generated_websites/${id}.html`,
    startUrl: `/startTest?id=${id}`,
  };

  // Save the test case to the file
  await writeFile(filePath, JSON.stringify(testCase, null, 2), "utf8");
  console.log(`Generated test case saved to: /generated_test_cases/${id}.json`);
}

// Keep the existing GET and DELETE endpoints
export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "generated_websites");
    const entries = await readdir(dir, { withFileTypes: true });
    const htmlFiles = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith(".html")
    );

    if (htmlFiles.length === 0) {
      return new Response(JSON.stringify({ urls: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const filesWithTimes = await Promise.all(
      htmlFiles.map(async (file) => {
        const fullPath = path.join(dir, file.name);
        const fileStat = await stat(fullPath);
        return { name: file.name, mtimeMs: fileStat.mtimeMs };
      })
    );

    filesWithTimes.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const urls = filesWithTimes.map((f) => `/generated_websites/${f.name}`);

    return new Response(JSON.stringify({ urls }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ urls: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let url: string | undefined;
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { url?: string };
      url = body?.url;
    } else {
      const { searchParams } = new URL(req.url);
      url = searchParams.get("url") ?? undefined;
    }

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Only allow deletions inside public/generated_websites
    const dir = path.join(process.cwd(), "public", "generated_websites");
    const cleaned = url.replace(/^https?:\/\/[^/]+/, "");
    const candidate = path.join(process.cwd(), "public", cleaned);
    const isInside = candidate.startsWith(dir + path.sep) || candidate === dir;
    if (!isInside || !candidate.endsWith(".html")) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    try {
      await unlink(candidate);
    } catch {
      // Ignore if already deleted
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
