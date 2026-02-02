import { extractAllClasses } from './extraction';

/**
 * Code location result
 */
export interface CodeLocation {
  lineStart: number;
  lineEnd: number;
  confidence: 'high' | 'medium' | 'low';
  matchedCode: string;
  reason: string;
  isComment?: boolean;
  allInstances?: Array<{ lineStart: number; lineEnd: number; isComment: boolean }>;
}

/**
 * Check if a line is a comment
 */
export function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('<!--') ||
    trimmed.includes('// ') && !trimmed.includes('<')
  );
}

/**
 * Check if code block is inside a comment or type definition
 */
export function isNonCodeContext(lines: string[], lineIndex: number): boolean {
  const line = lines[lineIndex];
  const trimmed = line.trim();

  // Direct comment check
  if (isCommentLine(line)) return true;

  // Check if inside a type definition (common false positive)
  if (trimmed.startsWith('|') && trimmed.includes('//')) return true;
  if (trimmed.startsWith('type ') || trimmed.startsWith('interface ')) return true;

  // Check surrounding context for multi-line comments
  let inBlockComment = false;
  for (let i = Math.max(0, lineIndex - 10); i <= lineIndex; i++) {
    const checkLine = lines[i];
    if (checkLine.includes('/*')) inBlockComment = true;
    if (checkLine.includes('*/')) inBlockComment = false;
  }

  return inBlockComment;
}

/**
 * Find all instances of matching code in a file
 */
export function findAllInstances(
  fileContent: string,
  originalHtml: string,
  textContent: string | null
): Array<{ lineStart: number; lineEnd: number; isComment: boolean }> {
  const lines = fileContent.split('\n');
  const htmlClasses = extractAllClasses(originalHtml);
  const significantClasses = htmlClasses.filter(c => c.length > 5 && !c.match(/^(sm:|md:|lg:|xl:)/));
  const instances: Array<{ lineStart: number; lineEnd: number; isComment: boolean }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for text content match
    const hasTextMatch = textContent && line.includes(textContent);

    // Check for class match (at least 2 significant classes)
    const lineClasses = extractAllClasses(line);
    const classMatches = significantClasses.filter(c => lineClasses.includes(c));
    const hasClassMatch = classMatches.length >= 2;

    if (hasTextMatch || hasClassMatch) {
      const isComment = isNonCodeContext(lines, i);

      // Find element boundaries
      let start = i;
      let end = i;

      for (let j = i; j >= Math.max(0, i - 5); j--) {
        if (lines[j].includes('<') && !isCommentLine(lines[j])) {
          start = j;
          break;
        }
      }

      for (let j = i; j < Math.min(lines.length, i + 5); j++) {
        if (lines[j].includes('>') && (lines[j].includes('/>') || lines[j].includes('</'))) {
          end = j;
          break;
        }
      }

      // Avoid duplicates
      const isDuplicate = instances.some(inst =>
        inst.lineStart === start + 1 && inst.lineEnd === end + 1
      );

      if (!isDuplicate) {
        instances.push({
          lineStart: start + 1,
          lineEnd: end + 1,
          isComment,
        });
      }
    }
  }

  // Sort by isComment (real code first), then by line number
  instances.sort((a, b) => {
    if (a.isComment !== b.isComment) return a.isComment ? 1 : -1;
    return a.lineStart - b.lineStart;
  });

  return instances;
}

/**
 * Find the location of HTML code in JSX source
 * Handles class -> className conversion
 */
export function findCodeInJsx(
  fileContent: string,
  originalHtml: string,
  textContent: string | null
): CodeLocation | null {
  const lines = fileContent.split('\n');
  const htmlClasses = extractAllClasses(originalHtml);
  const htmlTag = originalHtml.match(/<(\w+)/)?.[1]?.toLowerCase();

  // Find all instances first
  const allInstances = findAllInstances(fileContent, originalHtml, textContent);

  // Strategy 1: Find by text content (most reliable)
  if (textContent && textContent.length >= 3) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(textContent)) {
        const isComment = isNonCodeContext(lines, i);

        // Skip comments if we have non-comment matches
        if (isComment && allInstances.some(inst => !inst.isComment)) {
          continue;
        }

        // Look for the opening tag (could be same line or above)
        let tagStart = i;
        for (let j = i; j >= Math.max(0, i - 5); j--) {
          if (lines[j].match(/<\w+/) && !isCommentLine(lines[j])) {
            tagStart = j;
            break;
          }
        }

        // Find closing tag
        let tagEnd = i;
        for (let j = i; j < Math.min(lines.length, i + 5); j++) {
          if (lines[j].includes('>') && (lines[j].includes('/>') || lines[j].includes('</'))) {
            tagEnd = j;
            break;
          }
        }

        const matchedCode = lines.slice(tagStart, tagEnd + 1).join('\n');
        const matchedClasses = extractAllClasses(matchedCode);
        const classOverlap = matchedClasses.filter(c => htmlClasses.includes(c)).length;

        return {
          lineStart: tagStart + 1,
          lineEnd: tagEnd + 1,
          confidence: classOverlap > 2 ? 'high' : isComment ? 'low' : 'medium',
          matchedCode,
          reason: `Text "${textContent}" found with ${classOverlap} matching classes`,
          isComment,
          allInstances: allInstances.length > 1 ? allInstances : undefined,
        };
      }
    }
  }

  // Strategy 2: Find by unique class combination
  if (htmlClasses.length >= 2) {
    const significantClasses = htmlClasses.filter(c =>
      !c.match(/^(sm:|md:|lg:|xl:)/) && c.length > 4
    );

    for (let i = 0; i < lines.length; i++) {
      const lineClasses = extractAllClasses(lines[i]);
      const matches = significantClasses.filter(c => lineClasses.includes(c));

      if (matches.length >= Math.min(2, significantClasses.length)) {
        const isComment = isNonCodeContext(lines, i);

        // Skip comments if looking for real code
        if (isComment) continue;

        // Expand to full element
        let start = i;
        let end = i;
        let depth = 0;

        // Find element boundaries
        for (let j = i; j >= Math.max(0, i - 10); j--) {
          if (lines[j].includes('<') && !lines[j].trim().startsWith('//')) {
            start = j;
            break;
          }
        }

        for (let j = i; j < Math.min(lines.length, i + 10); j++) {
          const line = lines[j];
          depth += (line.match(/</g) || []).length;
          depth -= (line.match(/\/>/g) || []).length;
          depth -= (line.match(/<\//g) || []).length;
          if (depth <= 0 || line.includes('/>') || line.match(/<\/\w+>/)) {
            end = j;
            break;
          }
        }

        return {
          lineStart: start + 1,
          lineEnd: end + 1,
          confidence: matches.length >= 3 ? 'high' : 'medium',
          matchedCode: lines.slice(start, end + 1).join('\n'),
          reason: `${matches.length} matching classes: ${matches.slice(0, 3).join(', ')}`,
          isComment: false,
          allInstances: allInstances.length > 1 ? allInstances : undefined,
        };
      }
    }
  }

  // Strategy 3: Find by tag type + any matching class
  if (htmlTag) {
    const tagRegex = new RegExp(`<${htmlTag}[\\s>]`, 'i');

    for (let i = 0; i < lines.length; i++) {
      if (tagRegex.test(lines[i]) && !isNonCodeContext(lines, i)) {
        const lineClasses = extractAllClasses(lines[i]);
        const matches = lineClasses.filter(c => htmlClasses.includes(c));

        if (matches.length > 0) {
          return {
            lineStart: i + 1,
            lineEnd: i + 1,
            confidence: 'low',
            matchedCode: lines[i],
            reason: `<${htmlTag}> tag with ${matches.length} matching classes`,
            isComment: false,
            allInstances: allInstances.length > 1 ? allInstances : undefined,
          };
        }
      }
    }
  }

  return null;
}
