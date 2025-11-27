// Rule types
export type RuleType = 'selector' | 'attribute' | 'content' | 'structure';
export type RuleSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface RuleCondition {
  attribute?: string;
  operator?: 'exists' | 'not-exists' | 'equals' | 'not-equals' | 'contains' | 'matches';
  value?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  parent?: string;
  children?: string;
  siblings?: string;
}

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

export interface CreateRuleRequest {
  name: string;
  description?: string;
  type: RuleType;
  severity: RuleSeverity;
  selector: string;
  condition?: RuleCondition;
  message?: string;
  helpUrl?: string;
  wcagTags?: string[];
  enabled?: boolean;
}

export type UpdateRuleRequest = Partial<CreateRuleRequest>;

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  selector: string;
  message: string;
  element?: string;
  severity: RuleSeverity;
}

export interface RulesListResponse {
  success: boolean;
  data: {
    rules: CustomRule[];
    total: number;
    enabled: number;
  };
  error?: string;
}

export interface RuleResponse {
  success: boolean;
  data: CustomRule;
  error?: string;
}

export interface RuleTestResponse {
  success: boolean;
  data: {
    violations: Array<{ selector: string; message: string }>;
    passed: boolean;
  };
  error?: string;
}

export interface RuleExportResponse {
  success: boolean;
  data: {
    rules: CustomRule[];
    exportedAt: string;
    version: string;
  };
  error?: string;
}