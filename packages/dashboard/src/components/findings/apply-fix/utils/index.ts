// Storage utilities
export { getDomainFromUrl, getSavedRepo, saveRepoForDomain } from './storage';

// Content extraction utilities
export {
  extractTextContent,
  extractClassNames,
  normalizeForComparison,
  extractAllClasses,
  extractSignificantClasses,
} from './extraction';

// Match confidence utilities
export { calculateMatchConfidence, type MatchConfidence } from './matching';

// File ranking utilities
export { rankSearchResults, type RankedFile } from './ranking';

// Code location utilities
export {
  isCommentLine,
  isNonCodeContext,
  findAllInstances,
  findCodeInJsx,
  type CodeLocation,
} from './location';

// Code transformation utilities
export { htmlToJsx, applyFixToSource } from './transformation';
