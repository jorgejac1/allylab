import { extractAllClasses } from './extraction';

/**
 * Transform fixed HTML to JSX format
 */
export function htmlToJsx(html: string): string {
  return html
    // Convert class to className
    .replace(/\bclass=/g, 'className=')
    // Convert for to htmlFor
    .replace(/\bfor=/g, 'htmlFor=')
    // Convert style string to object (basic)
    .replace(/style="([^"]+)"/g, (_, styles) => {
      const styleObj = styles.split(';')
        .filter((s: string) => s.trim())
        .map((s: string) => {
          const [prop, val] = s.split(':').map((x: string) => x.trim());
          const camelProp = prop.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
          return `${camelProp}: "${val}"`;
        })
        .join(', ');
      return `style={{ ${styleObj} }}`;
    })
    // Self-close void elements
    .replace(/<(img|input|br|hr|meta|link)([^>]*)(?<!\/)>/gi, '<$1$2 />');
}

/**
 * Apply the fix to source code, handling HTML -> JSX conversion
 */
export function applyFixToSource(
  sourceCode: string,
  originalHtml: string,
  fixedHtml: string
): string {
  // First try direct replacement (unlikely to work for JSX)
  if (sourceCode.includes(originalHtml)) {
    return sourceCode.replace(originalHtml, fixedHtml);
  }

  // Convert fixed HTML to JSX
  const fixedJsx = htmlToJsx(fixedHtml);

  // Try to find and replace by class matching
  const htmlClasses = extractAllClasses(originalHtml);
  const significantClasses = htmlClasses.filter(c => c.length > 5).slice(0, 3);

  if (significantClasses.length > 0) {
    // Build a regex to find similar elements
    const classPattern = significantClasses.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    const regex = new RegExp(`<\\w+[^>]*className=["'][^"']*${classPattern}[^"']*["'][^>]*>`, 'g');

    // Try to replace using the regex pattern
    const match = sourceCode.match(regex);
    if (match && match.length === 1) {
      // Only replace if we found exactly one match (safe replacement)
      return sourceCode.replace(regex, fixedJsx);
    }
  }

  return fixedJsx;
}
