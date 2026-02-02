import type { CustomRule, CreateRuleRequest, RuleType, RuleSeverity, RuleCondition } from '../../../types/rules';

export interface RulesHeaderProps {
  enabledRules: number;
  totalRules: number;
  rulesCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onNewRule: () => void;
}

export interface RuleFormProps {
  formData: CreateRuleRequest;
  editingRule: CustomRule | null;
  testHtml: string;
  testResults: { passed: boolean; violations: Array<{ selector: string; message: string }> } | null;
  loading: boolean;
  onUpdateField: <K extends keyof CreateRuleRequest>(field: K, value: CreateRuleRequest[K]) => void;
  onUpdateCondition: (updates: Partial<RuleCondition>) => void;
  onToggleWcagTag: (tag: string) => void;
  onTestHtmlChange: (html: string) => void;
  onTest: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface RulesListProps {
  rules: CustomRule[];
  loading: boolean;
  onEdit: (rule: CustomRule) => void;
  onDelete: (id: string, name: string) => void;
  onToggle: (id: string) => void;
}

export interface RuleItemProps {
  rule: CustomRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export interface FormFieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export interface WcagTagButtonProps {
  tag: string;
  isSelected: boolean;
  onClick: () => void;
}

export interface SeverityBadgeProps {
  severity: RuleSeverity;
}

export type { CustomRule, CreateRuleRequest, RuleType, RuleSeverity, RuleCondition };
