function stripFences(s: string): string {
  return (s || "").replace(/```[\s\S]*?```/g, "").trim();
}
function normalizeAngles(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function getTagInner(text: string, tag: string): string | null {
  const t = normalizeAngles(text);
  const m = t.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

// Build a regex that finds a heading like "Description", "Summary", etc.
// Accepts variants like "# Description", "1) Description", "- Description", "DESCRIPTION", with optional colon.
function headingRegex(name: string): RegExp {
  return new RegExp(
    `(?:^|\\n)\\s*(?:#{1,6}\\s*|\\d+\\)\\s*|[-*•]\\s*)?${name}\\s*:?\\s*(?:\\n|$)`,
    "i"
  );
}

// Generic “next heading” boundary across common section names.
const BOUNDARY = new RegExp(
  String.raw`(?:^|\n)\s*(?:#{1,6}\s*|\d+\)\s*|[-*•]\s*)?(?:description|summary|name|html|preamble|reasoning|output|inputs|goals|components|steps|spec|examples)\s*:?\s*(?:\n|$)`,
  "ig"
);

function getHeadingSection(
  raw: string,
  name: string,
  { singleLine = false } = {}
): string {
  const text = stripFences(normalizeAngles(raw)).replace(/\r/g, "");
  const startMatch = headingRegex(name).exec(text);
  if (!startMatch) return "";

  const start = startMatch.index + startMatch[0].length;

  if (singleLine) {
    // First non-empty line after the heading
    const after = text.slice(start);
    const line = (after.match(/[^\n]*\S[^\n]*/) || [""])[0];
    return line.trim();
  }

  // Find the next boundary AFTER start
  BOUNDARY.lastIndex = start;
  const next = BOUNDARY.exec(text);
  const end = next ? next.index : text.length;

  return text.slice(start, end).trim();
}

export function extractHtmlOnly(raw: string): string {
  if (!raw) return "";
  let t = stripFences(raw);
  const startIdx = (() => {
    const d = t.search(/<!doctype\s+html>/i);
    if (d >= 0) return d;
    const h = t.search(/<html\b/i);
    return h >= 0 ? h : -1;
  })();
  if (startIdx < 0) return "";
  t = t.slice(startIdx);
  const endIdx = t.search(/<\/html>/i);
  if (endIdx >= 0) t = t.slice(0, endIdx + "</html>".length);
  // Add <script defer src="/bats-tracker.js"></script> into the head
  t = t.replace(
    /<head>/i,
    '<head><script defer src="/bats-tracker.js"></script><script defer src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>'
  );
  return t.trim();
}

export function extractDescription(raw: string): string {
  const byTag = getTagInner(raw, "description");
  if (byTag) return byTag;
  return getHeadingSection(raw, "description"); // multi-line until next heading
}

export function extractDescriptionSummary(raw: string): string {
  const byTag = getTagInner(raw, "summary");
  if (byTag) return byTag;
  return getHeadingSection(raw, "summary"); // multi-line until next heading
}

export function extractName(raw: string): string {
  const byTag = getTagInner(raw, "name");
  if (byTag) return byTag;
  return getHeadingSection(raw, "name", { singleLine: true });
}

export function extractPreamble(raw: string): string {
  const text = stripFences(normalizeAngles(raw)).replace(/\r/g, "");
  // Prefer explicit PREAMBLE → HTML
  const byHeaders = text.match(
    /(?:^|\n)\s*(?:1\)\s*)?PREAMBLE\s*:?\s*\n([\s\S]*?)(?:\n\s*(?:2\)\s*)?HTML\b)/i
  );
  if (byHeaders?.[1]) {
    return byHeaders[1]
      .split("\n")
      .filter((ln) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(ln))
      .join("\n")
      .trim();
  }
  // Fallback: everything before <!doctype html> or <html>
  const idx = text.search(/<!doctype\s+html>|<html\b/i);
  return idx > 0
    ? text
        .slice(0, idx)
        .split("\n")
        .filter((ln) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(ln))
        .join("\n")
        .trim()
    : "";
}
