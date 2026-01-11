// localStorage key for remembering repo per domain
const REPO_STORAGE_KEY = 'allylab-domain-repos';

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getSavedRepo(domain: string): { owner: string; repo: string } | null {
  try {
    const saved = localStorage.getItem(REPO_STORAGE_KEY);
    if (saved) {
      const mapping = JSON.parse(saved);
      return mapping[domain] || null;
    }
  } catch (e) {
    console.error('[ApplyFixModal] Failed to load saved repo:', e);
  }
  return null;
}

export function saveRepoForDomain(domain: string, owner: string, repo: string): void {
  try {
    const saved = localStorage.getItem(REPO_STORAGE_KEY);
    const mapping = saved ? JSON.parse(saved) : {};
    mapping[domain] = { owner, repo };
    localStorage.setItem(REPO_STORAGE_KEY, JSON.stringify(mapping));
  } catch (e) {
    console.error('[ApplyFixModal] Failed to save repo:', e);
  }
}

export function extractTextContent(html: string): string | null {
  const match = html.match(/>([^<]{2,50})</);
  if (match && match[1].trim() && !match[1].match(/^[\s.]+$/)) {
    return match[1].trim();
  }
  return null;
}

export function extractClassNames(selector: string): string[] {
  const matches = selector.match(/\.([a-zA-Z0-9_\-[:\]]+)/g);
  if (!matches) return [];
  return matches
    .map(m => m.slice(1))
    .filter(c => c.length > 3 && !c.match(/^(hover|focus|active|group-hover)/))
    .slice(0, 5);
}

// ============================================
// JSX-Aware Code Matching
// ============================================

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

/**
 * Calculate match confidence between original HTML and source JSX
 */
export interface MatchConfidence {
  score: number;           // 0-100
  level: 'high' | 'medium' | 'low' | 'none';
  matchedClasses: string[];
  matchedText: string | null;
  details: string;
}

export function calculateMatchConfidence(
  sourceCode: string,
  originalHtml: string,
  textContent: string | null
): MatchConfidence {
  const sourceClasses = extractAllClasses(sourceCode);
  const htmlClasses = extractAllClasses(originalHtml);
  
  // Count matching classes
  const matchedClasses = sourceClasses.filter(c => htmlClasses.includes(c));
  const classMatchRatio = htmlClasses.length > 0 
    ? matchedClasses.length / htmlClasses.length 
    : 0;
  
  // Check for text content match
  const hasTextMatch = textContent 
    ? sourceCode.includes(textContent) 
    : false;
  
  // Calculate score
  let score = 0;
  
  // Class matching (up to 60 points)
  score += Math.min(classMatchRatio * 60, 60);
  
  // Text content match (40 points)
  if (hasTextMatch) score += 40;
  
  // Bonus for exact tag match
  const sourceTag = sourceCode.match(/<(\w+)/)?.[1];
  const htmlTag = originalHtml.match(/<(\w+)/)?.[1];
  if (sourceTag && htmlTag && sourceTag.toLowerCase() === htmlTag.toLowerCase()) {
    score += 10;
  }
  
  // Cap at 100
  score = Math.min(score, 100);
  
  // Determine confidence level
  let level: MatchConfidence['level'];
  let details: string;
  
  if (score >= 80) {
    level = 'high';
    details = `Strong match: ${matchedClasses.length} classes${hasTextMatch ? ' + text' : ''}`;
  } else if (score >= 50) {
    level = 'medium';
    details = `Likely match: ${matchedClasses.length} classes${hasTextMatch ? ' + text' : ''}`;
  } else if (score >= 20) {
    level = 'low';
    details = `Possible match: ${matchedClasses.length} classes`;
  } else {
    level = 'none';
    details = 'No significant match found';
  }
  
  return {
    score,
    level,
    matchedClasses,
    matchedText: hasTextMatch ? textContent : null,
    details,
  };
}

// ============================================
// File Ranking
// ============================================

export interface RankedFile {
  path: string;
  preview?: string;
  confidence: MatchConfidence;
  isBestMatch: boolean;
}

/**
 * Rank search results by match confidence
 */
export function rankSearchResults(
  results: Array<{ path: string; preview?: string; content?: string }>,
  originalHtml: string,
  textContent: string | null
): RankedFile[] {
  const ranked = results.map(file => {
    const sourceCode = file.content || file.preview || '';
    const confidence = calculateMatchConfidence(sourceCode, originalHtml, textContent);
    
    return {
      path: file.path,
      preview: file.preview,
      confidence,
      isBestMatch: false,
    };
  });
  
  // Sort by confidence score (highest first)
  ranked.sort((a, b) => b.confidence.score - a.confidence.score);
  
  // Mark the best match if confidence is medium or higher
  if (ranked.length > 0 && ranked[0].confidence.level !== 'none') {
    ranked[0].isBestMatch = true;
  }
  
  return ranked;
}

// ============================================
// JSX Code Location Finding
// ============================================

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

// ============================================
// Code Transformation
// ============================================

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
    
    // Log hint for manual replacement if multiple or no matches
    console.log('[applyFixToSource] Pattern found:', match?.length ?? 0, 'matches. Suggested JSX:', fixedJsx);
  }
  
  return fixedJsx;
}