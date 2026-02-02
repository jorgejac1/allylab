import { extractAllClasses } from './extraction';

/**
 * Match confidence result
 */
export interface MatchConfidence {
  score: number;           // 0-100
  level: 'high' | 'medium' | 'low' | 'none';
  matchedClasses: string[];
  matchedText: string | null;
  details: string;
}

/**
 * Calculate match confidence between original HTML and source JSX
 */
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
