function normalizeAngles(s: string): string {
  // Only normalize angle brackets so we can match tags even if they came HTML-escaped.
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function getTagInner(raw: string, tag: string): string {
  if (!raw) return "";
  const text = normalizeAngles(raw);
  // Match <tag ...> ... </tag> (case-insensitive, non-greedy inner)
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

export function extractHtmlOnly(raw: string): string {
  if (!raw) return "";
  // Strip common code-fence wrappers
  let t = raw
    .replace(/```html\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  // Prefer <!doctype ...> start, fallback to <html ...>
  const doctypeIdx = t.search(/<!doctype\s+html>/i);
  const htmlIdx = t.search(/<html\b/i);
  const start = doctypeIdx >= 0 ? doctypeIdx : htmlIdx;
  if (start < 0) return "";
  t = t.slice(start);
  // End at the first </html> after start (non-greedy)
  const endMatch = t.match(/<\/html>/i);
  if (endMatch) {
    const end = t.toLowerCase().indexOf("</html>") + "</html>".length;
    t = t.slice(0, end);
  }
  return t.trim();
}

export function extractDescription(raw: string): string {
  return getTagInner(raw, "description");
}

export function extractDescriptionSummary(raw: string): string {
  // If you actually intend "summary" (not description again), use:
  // return getTagInner(raw, "summary");
  // Keeping the name but fixing behavior to return inner content of <description>…</description>.
  return getTagInner(raw, "description");
}

export function extractName(raw: string): string {
  return getTagInner(raw, "name");
}

export function extractPreamble(raw: string): string {
  if (!raw) return "";
  const text = normalizeAngles(raw).replace(/\r/g, "");

  // Prefer explicit "PREAMBLE ... HTML" section
  const byHeaders = text.match(
    /(?:^|\n)\s*(?:1\)\s*)?PREAMBLE\s*:?\s*\n([\s\S]*?)(?:\n\s*(?:2\)\s*)?HTML\b)/i
  );
  if (byHeaders?.[1]) {
    return byHeaders[1]
      .split("\n")
      .filter((line) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(line))
      .join("\n")
      .trim();
  }

  // Otherwise: anything before <!doctype html> or <html>
  const idx = text.search(/<!doctype\s+html>|<html\b/i);
  if (idx > 0) {
    return text
      .slice(0, idx)
      .split("\n")
      .filter((line) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(line))
      .join("\n")
      .trim();
  }

  return "";
}
