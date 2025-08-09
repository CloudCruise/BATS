import { mkdir, writeFile, readdir, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetchAndCompilePrompt } from "@/lib/langfuse";

export const runtime = "nodejs";

type GenerateRequestBody = {
  prompt?: string;
};

function buildFallbackHtml(userPrompt: string): string {
  const safePrompt = (userPrompt || "").slice(0, 2000);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Generated Test Site</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 0; }
      header { padding: 16px 24px; border-bottom: 1px solid #ddd; }
      main { padding: 24px; max-width: 900px; margin: 0 auto; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin-top: 16px; }
      button { padding: 10px 14px; border-radius: 10px; border: 1px solid #888; cursor: pointer; }
    </style>
  </head>
  <body>
    <header>
      <strong>Generated test site</strong>
    </header>
    <main>
      <h1>Scenario</h1>
      <p>This page was generated for the scenario:</p>
      <div class="card" id="scenario">${safePrompt || "No prompt provided."}</div>
      <div class="card">
        <h2>Interactions</h2>
        <p>Includes a delayed, unexpected popup to challenge browser agents.</p>
        <button id="start">Start flow</button>
        <button id="maybe">Maybe later</button>
      </div>
    </main>
    <script>
      // Random delay to simulate unpredictability
      function randomDelay(msMin, msMax) { return Math.floor(Math.random() * (msMax - msMin + 1)) + msMin; }
      const start = document.getElementById('start');
      const maybe = document.getElementById('maybe');
      let timer;
      function schedulePopup() {
        clearTimeout(timer);
        timer = setTimeout(() => {
          alert('Unexpected popup: Please confirm to continue.');
          const div = document.createElement('div');
          div.textContent = 'Popup acknowledged at ' + new Date().toLocaleTimeString();
          div.setAttribute('data-popup-ack', 'true');
          document.body.appendChild(div);
        }, randomDelay(800, 3500));
      }
      start.addEventListener('click', schedulePopup);
      maybe.addEventListener('mouseover', schedulePopup);
      // Also trigger once after load
      window.addEventListener('load', () => setTimeout(schedulePopup, 1000));
    </script>
  </body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const prompt = (body?.prompt || "").trim();

    // Try LLM first; if not configured, fall back to template
    let htmlContent: string | undefined;
    try {
      const model = openai("gpt-5-nano");
      // Fetch system prompt from Langfuse Prompt Management (text prompt)
      const systemPrompt = await fetchAndCompilePrompt("generate-website").catch(() =>
        "You produce a single self-contained HTML file for browser-agent testing. Include minimal CSS and JavaScript. Prefer inline scripts and styles. Avoid external dependencies. Ensure the page loads without network access."
      );
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt:
          `Create an HTML test page for the following scenario. The page should contain clear interactive elements with stable selectors (ids or data-testid) and at least one non-deterministic or delayed UI event (like a popup or modal). Scenario: ${prompt}`,
        experimental_telemetry: { isEnabled: true },
      });
      // Heuristic: ensure we have full HTML markup; if model returned partial, wrap it
      const normalized = text.trim();
      if (/<!doctype html>/i.test(normalized) || /<html[\s>]/i.test(normalized)) {
        htmlContent = normalized;
      } else {
        htmlContent = buildFallbackHtml(prompt);
      }
    } catch {
      htmlContent = buildFallbackHtml(prompt);
    }

    const id = randomUUID();
    const dir = path.join(process.cwd(), "public", "generated_websites");
    const filePath = path.join(dir, `${id}.html`);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, htmlContent!, "utf8");

    const relativeUrl = `/generated_websites/${id}.html`;
    return new Response(JSON.stringify({ url: relativeUrl }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("/api/generate error", err);
    return new Response(JSON.stringify({ error: "Failed to generate" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "generated_websites");
    const entries = await readdir(dir, { withFileTypes: true });
    const htmlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".html"));

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


