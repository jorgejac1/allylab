import { calculateMatchConfidence, type MatchConfidence } from './matching';

/**
 * Ranked file result with confidence
 */
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
