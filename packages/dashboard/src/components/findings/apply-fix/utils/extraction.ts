/**
 * Extract text content from HTML (for matching purposes)
 */
export function extractTextContent(html: string): string | null {
  const match = html.match(/>([^<]{2,50})</);
  if (match && match[1].trim() && !match[1].match(/^[\s.]+$/)) {
    return match[1].trim();
  }
  return null;
}

/**
 * Extract class names from a CSS selector
 */
export function extractClassNames(selector: string): string[] {
  const matches = selector.match(/\.([a-zA-Z0-9_\-[:\]]+)/g);
  if (!matches) return [];
  return matches
    .map(m => m.slice(1))
    .filter(c => c.length > 3 && !c.match(/^(hover|focus|active|group-hover)/))
    .slice(0, 5);
}

/**
 * Normalize HTML/JSX for comparison
 * - Converts class= to className=
 * - Normalizes quotes and whitespace
 * - Handles self-closing tags
 */
export function normalizeForComparison(code: string): string {
  return code
    // Normalize attribute names (HTML -> JSX)
    .replace(/\bclass=/gi, 'className=')
    .replace(/\bfor=/gi, 'htmlFor=')
    // Normalize quotes
    .replace(/'/g, '"')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove newlines within tags
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Extract all class names from HTML or JSX
 */
export function extractAllClasses(code: string): string[] {
  // Match both class="..." and className="..." or className={`...`}
  const classRegex = /(?:class|className)=["'{`]([^"'}`]+)["'}`]/gi;
  const classes: string[] = [];

  let match;
  while ((match = classRegex.exec(code)) !== null) {
    const classList = match[1].split(/\s+/).filter(c => c.length > 0);
    classes.push(...classList);
  }

  return [...new Set(classes)]; // Remove duplicates
}

/**
 * Extract significant classes (skip utility prefixes like w-, h-, p-, m-)
 */
export function extractSignificantClasses(code: string): string[] {
  const allClasses = extractAllClasses(code);

  return allClasses.filter(c => {
    // Keep semantic/meaningful classes
    if (c.includes('text-') && c.includes('-')) return true; // text-green-600
    if (c.includes('bg-') && c.includes('-')) return true;   // bg-primary-600
    if (c.includes('border-')) return true;
    if (c.includes('rounded')) return true;
    if (c.includes('flex') || c.includes('grid')) return true;
    if (c.includes('font-')) return true;
    // Skip very common utility classes
    if (c.match(/^(w-|h-|p-|m-|px-|py-|mx-|my-|pt-|pb-|pl-|pr-|mt-|mb-|ml-|mr-)\d/)) return false;
    if (c.match(/^(sm:|md:|lg:|xl:|2xl:)/)) return true; // Keep responsive variants
    return c.length > 4;
  });
}
