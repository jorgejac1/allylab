// Extract text content from HTML
export function extractTextContent(html: string): string | null {
  const match = html.match(/>([^<]{2,100})</);
  if (match && match[1].trim() && !match[1].match(/^[\s.]+$/)) {
    return match[1].trim();
  }
  return null;
}

// Extract meaningful class names from selector
export function extractClassNames(selector: string): string[] {
  const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
  if (!classMatches) return [];

  return classMatches
    .map(m => m.slice(1))
    .filter(c => c.length > 3 && !c.match(/^(hover|focus|active|disabled|w-|h-|p-|m-|flex|grid)/))
    .slice(0, 3);
}
