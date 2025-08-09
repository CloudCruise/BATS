import { mkdir, writeFile, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetchAndCompilePrompt } from "@/lib/langfuse";

export const runtime = "nodejs";

type GenerateRequestBody = {
  prompt?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  websiteType?: 'insurance' | 'healthcare' | 'ecommerce' | 'banking' | 'education' | 'government' | 'travel' | 'real-estate' | 'generic';
};



export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const prompt = (body?.prompt || "").trim();
    const difficulty = body?.difficulty || 'medium';
    const websiteType = body?.websiteType || 'generic';

    // Generate HTML using AI model
    const model = openai("gpt-5-mini");
    
    // Create dynamic system prompt based on difficulty and website type
      const getDifficultyInstructions = (diff: string) => {
        switch (diff) {
          case 'easy':
            return `Create a simple, clean website with minimal elements (3-5 interactive components). Use basic styling and straightforward interactions. Include 1-2 simple UI challenges like a basic popup or form validation.`;
          case 'hard':
            return `Create a complex, feature-rich website with many interactive elements (15+ components). Use advanced styling, multiple sections, dynamic content, nested forms, modals, dropdowns, carousels, and complex user flows. Include 4-6 challenging UI scenarios like delayed popups, multi-step processes, dynamic content loading, and unpredictable interface changes.`;
          default: // medium
            return `Create a moderately complex website with several interactive elements (8-12 components). Use good styling and multiple sections. Include 2-4 UI challenges like modals, form interactions, and timed events.`;
        }
      };

      const getWebsiteTypeInstructions = (type: string) => {
        switch (type) {
          case 'insurance':
            return `Style as an insurance website with professional blue/gray colors, policy forms, quote calculators, claim submission forms, and coverage comparison tables.`;
          case 'healthcare':
            return `Style as a healthcare website with clean white/blue colors, appointment booking, patient forms, symptom checkers, and medical information sections.`;
          case 'ecommerce':
            return `Style as an e-commerce website with product catalogs, shopping cart, checkout forms, product filters, reviews, and promotional banners.`;
          case 'banking':
            return `Style as a banking website with secure-looking design, account login forms, transaction tables, loan calculators, and financial tools.`;
          case 'education':
            return `Style as an educational website with course catalogs, enrollment forms, student portals, assignment submissions, and academic calendars.`;
          case 'government':
            return `Style as a government website with official styling, permit applications, service forms, document uploads, and bureaucratic workflows.`;
          case 'travel':
            return `Style as a travel website with booking forms, destination galleries, itinerary builders, review systems, and travel planning tools.`;
          case 'real-estate':
            return `Style as a real estate website with property listings, search filters, contact forms, virtual tour buttons, and mortgage calculators.`;
          default: // generic
            return `Use a clean, modern design with neutral colors and standard web components.`;
        }
      };

      const systemPrompt = await fetchAndCompilePrompt("generate-website").catch(() =>
        `You produce a single self-contained HTML file for browser-agent testing. Include minimal CSS and JavaScript. Prefer inline scripts and styles. Avoid external dependencies. Ensure the page loads without network access.

${getDifficultyInstructions(difficulty)}

${getWebsiteTypeInstructions(websiteType)}

CRITICAL: Output ONLY the HTML code. Do not include any reasoning, explanations, or commentary. Start directly with <!doctype html> and end with </html>. No markdown code blocks or other formatting.`
    );
    
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt:
        `Create an HTML test page for the following scenario. The page should contain clear interactive elements with stable selectors (ids or data-testid) and at least one non-deterministic or delayed UI event (like a popup or modal). Scenario: ${prompt}`,
      experimental_telemetry: { isEnabled: true },
    });
    
    // Filter out any reasoning traces and extract only HTML content
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```html\s*/gi, '').replace(/```\s*$/g, '');
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
    
    // Remove reasoning sections that might be wrapped in XML-like tags
    cleanedText = cleanedText.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove any text before the DOCTYPE or HTML tag
    const docTypeMatch = cleanedText.match(/(<!doctype html>[\s\S]*)/i);
    if (docTypeMatch) {
      cleanedText = docTypeMatch[1];
    } else {
      // Look for HTML tag start and extract from there to end
      const htmlTagMatch = cleanedText.match(/(<html[\s\S]*)/i);
      if (htmlTagMatch) {
        cleanedText = htmlTagMatch[1];
      }
    }
    
    // If the text contains both reasoning and HTML, try to extract just the HTML part
    const htmlMatch = cleanedText.match(/<!doctype html>[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      cleanedText = htmlMatch[0];
    }
    
    const htmlContent = cleanedText.trim();

    const id = randomUUID();
    const dir = path.join(process.cwd(), "public", "generated_websites");
    const filePath = path.join(dir, `${id}.html`);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, htmlContent, "utf8");

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
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to delete" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


