export type RuleType = 'selector' | 'attribute' | 'content' | 'structure';
export type RuleSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  severity: RuleSeverity;
  selector: string;
  condition: RuleCondition;
  message: string;
  helpUrl?: string;
  wcagTags: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  // For 'attribute' type
  attribute?: string;
  operator?: 'exists' | 'not-exists' | 'equals' | 'not-equals' | 'contains' | 'matches';
  value?: string;
  
  // For 'content' type
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  
  // For 'structure' type
  parent?: string;
  children?: string;
  siblings?: string;
}

export interface CreateRuleRequest {
  name: string;
  description: string;
  type: RuleType;
  severity: RuleSeverity;
  selector: string;
  condition: RuleCondition;
  message: string;
  helpUrl?: string;
  wcagTags?: string[];
  enabled?: boolean;
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  type?: RuleType;
  severity?: RuleSeverity;
  selector?: string;
  condition?: RuleCondition;
  message?: string;
  helpUrl?: string;
  wcagTags?: string[];
  enabled?: boolean;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  selector: string;
  html: string;
  message: string;
  severity: RuleSeverity;
  wcagTags: string[];
}