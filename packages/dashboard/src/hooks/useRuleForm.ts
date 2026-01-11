import { useState, useCallback } from 'react';
import { resolveWcagTags } from '../utils/wcag';
import type { 
  CustomRule, 
  CreateRuleRequest, 
  RuleType, 
  RuleSeverity, 
  RuleCondition 
} from '../types/rules';

const INITIAL_FORM_DATA: CreateRuleRequest = {
  name: '',
  description: '',
  type: 'selector',
  severity: 'serious',
  selector: '',
  condition: { operator: 'not-exists' },
  message: '',
  helpUrl: '',
  wcagTags: [],
  enabled: true,
};

interface TestResults {
  passed: boolean;
  violations: Array<{ selector: string; message: string }>;
}

interface UseRuleFormReturn {
  formData: CreateRuleRequest;
  editingRule: CustomRule | null;
  testHtml: string;
  testResults: TestResults | null;
  setFormData: React.Dispatch<React.SetStateAction<CreateRuleRequest>>;
  setTestHtml: (html: string) => void;
  setTestResults: (results: TestResults | null) => void;
  resetForm: () => void;
  loadRuleForEdit: (rule: CustomRule) => void;
  updateField: <K extends keyof CreateRuleRequest>(field: K, value: CreateRuleRequest[K]) => void;
  updateType: (type: RuleType) => void;
  updateSeverity: (severity: RuleSeverity) => void;
  updateCondition: (updates: Partial<RuleCondition>) => void;
  toggleWcagTag: (tag: string) => void;
}

export function useRuleForm(): UseRuleFormReturn {
  const [formData, setFormData] = useState<CreateRuleRequest>(INITIAL_FORM_DATA);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [testHtml, setTestHtml] = useState('');
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setEditingRule(null);
    setTestResults(null);
    setTestHtml('');
  }, []);

  const loadRuleForEdit = useCallback((rule: CustomRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      severity: rule.severity,
      selector: rule.selector,
      condition: rule.condition,
      message: rule.message,
      helpUrl: rule.helpUrl,
      wcagTags: rule.wcagTags,
      enabled: rule.enabled,
    });
    setEditingRule(rule);
  }, []);

  const updateField = useCallback(<K extends keyof CreateRuleRequest>(
    field: K,
    value: CreateRuleRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateType = useCallback((type: RuleType) => {
    setFormData(prev => ({ ...prev, type }));
  }, []);

  const updateSeverity = useCallback((severity: RuleSeverity) => {
    setFormData(prev => ({ ...prev, severity }));
  }, []);

  const updateCondition = useCallback((updates: Partial<RuleCondition>) => {
    setFormData(prev => ({
      ...prev,
      condition: { ...prev.condition, ...updates },
    }));
  }, []);

  const toggleWcagTag = useCallback((tag: string) => {
    setFormData(prev => {
      const tags = resolveWcagTags(prev.wcagTags);
      const newTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag];
      return { ...prev, wcagTags: newTags };
    });
  }, []);

  return {
    formData,
    editingRule,
    testHtml,
    testResults,
    setFormData,
    setTestHtml,
    setTestResults,
    resetForm,
    loadRuleForEdit,
    updateField,
    updateType,
    updateSeverity,
    updateCondition,
    toggleWcagTag,
  };
}