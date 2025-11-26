export type FrameworkType = 'html' | 'react' | 'vue' | 'angular';

export interface CodeFix {
  id: string;
  findingId: string;
  ruleId: string;
  
  // Original code
  original: {
    code: string;
    selector: string;
    language: string;
  };
  
  // Fixed code for each framework
  fixes: {
    html: string;
    react?: string;
    vue?: string;
    angular?: string;
  };
  
  // Unified diff format
  diff: string;
  
  // Explanation
  explanation: string;
  
  // Confidence score
  confidence: 'high' | 'medium' | 'low';
  
  // Estimated effort
  effort: 'trivial' | 'easy' | 'medium' | 'complex';
  
  // WCAG reference
  wcagCriteria: string[];
  
  createdAt: string;
}

export interface FixGenerationRequest {
  finding: {
    ruleId: string;
    ruleTitle: string;
    description: string;
    html: string;
    selector: string;
    wcagTags: string[];
    impact: string;
  };
  framework?: FrameworkType;
  context?: string; // Additional context about the codebase
}

export interface FixGenerationResponse {
  success: boolean;
  fix?: CodeFix;
  error?: string;
}