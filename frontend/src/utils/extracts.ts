export function extractHtmlOnly(raw: string): string {
  if (!raw) return "";
  let t = raw.replace(/```html\s*/gi, "").replace(/```/g, "");
  const doctypeIdx = t.search(/<!doctype html>/i);
  const htmlIdx = t.search(/<html[\s>]/i);
  const start = doctypeIdx >= 0 ? doctypeIdx : htmlIdx;
  if (start < 0) return "";
  t = t.slice(start);
  const end = t.search(/<\/html>/i);
  if (end >= 0) t = t.slice(0, end + "</html>".length);
  return t.trim();
}

export function extractDescription(raw: string): string {
  // Search for <description> tag and return everything after it
  const descriptionIdx = raw.search(/<description>[\s\S]*<\/description>/i);
  if (descriptionIdx >= 0) {
    return raw.slice(descriptionIdx + "<description>".length).trim();
  }
  return "";
}

export function extractDescriptionSummary(raw: string): string {
  // Search for <description> tag and return everything after it
  const descriptionIdx = raw.search(/<description>[\s\S]*<\/description>/i);
  if (descriptionIdx >= 0) {
    return raw.slice(descriptionIdx + "<description>".length).trim();
  }
  return "";
}

export function extractName(raw: string): string {
  // Search for <name> tag and return everything after it
  const nameIdx = raw.search(/<name>[\s\S]*<\/name>/i);
  if (nameIdx >= 0) {
    return raw.slice(nameIdx + "<name>".length).trim();
  }
  return "";
}

export function extractPreamble(raw: string): string {
  if (!raw) return "";
  const text = raw.replace(/\r/g, "");
  // Prefer explicit PREAMBLE → HTML section
  const byHeaders = text.match(
    /(?:^|\n)\s*(?:1\)\s*)?PREAMBLE\s*:?\s*\n([\s\S]*?)(?:\n\s*(?:2\)\s*)?HTML\b)/i
  );
  if (byHeaders && byHeaders[1]) {
    return byHeaders[1]
      .split("\n")
      .filter((line) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(line))
      .join("\n")
      .trim();
  }
  // Otherwise, anything before <!doctype html> or <html>
  const idx = text.search(/<!doctype html>|<html[\s>]/i);
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
