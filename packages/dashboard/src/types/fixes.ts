export type FrameworkType = 'html' | 'react' | 'vue' | 'angular';

export interface CodeFix {
  id: string;
  findingId: string;
  ruleId: string;
  
  original: {
    code: string;
    selector: string;
    language: string;
  };
  
  fixes: {
    html: string;
    react?: string;
    vue?: string;
    angular?: string;
  };
  
  diff: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  effort: 'trivial' | 'easy' | 'medium' | 'complex';
  wcagCriteria: string[];
  createdAt: string;
}