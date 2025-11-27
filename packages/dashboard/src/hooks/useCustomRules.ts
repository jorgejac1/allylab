import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { 
  CustomRule, 
  CreateRuleRequest, 
  UpdateRuleRequest,
  RulesListResponse,
  RuleResponse,
  RuleTestResponse,
  RuleExportResponse,
} from '../types/rules';

interface UseCustomRulesReturn {
  rules: CustomRule[];
  loading: boolean;
  error: string | null;
  totalRules: number;
  enabledRules: number;
  fetchRules: () => Promise<void>;
  getRule: (id: string) => Promise<CustomRule | null>;
  createRule: (rule: CreateRuleRequest) => Promise<CustomRule | null>;
  updateRule: (id: string, updates: UpdateRuleRequest) => Promise<CustomRule | null>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (id: string) => Promise<boolean>;
  testRule: (rule: CreateRuleRequest, html: string) => Promise<RuleTestResponse['data'] | null>;
  importRules: (rules: CustomRule[]) => Promise<{ imported: number; total: number } | null>;
  exportRules: () => Promise<RuleExportResponse['data'] | null>;
}

export function useCustomRules(): UseCustomRulesReturn {
  const [apiUrl] = useLocalStorage('allylab_api_url', 'http://localhost:3001');
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRules, setTotalRules] = useState(0);
  const [enabledRules, setEnabledRules] = useState(0);

  // Fetch all rules
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/rules`);
      const data: RulesListResponse = await response.json();
      
      if (data.success) {
        setRules(data.data.rules);
        setTotalRules(data.data.total);
        setEnabledRules(data.data.enabled);
      } else {
        setError(data.error || 'Failed to fetch rules');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Get a single rule
  const getRule = useCallback(async (id: string): Promise<CustomRule | null> => {
    try {
      const response = await fetch(`${apiUrl}/rules/${id}`);
      const data: RuleResponse = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [apiUrl]);

  // Create a new rule
  const createRule = useCallback(async (rule: CreateRuleRequest): Promise<CustomRule | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const data: RuleResponse = await response.json();
      
      if (data.success) {
        await fetchRules(); // Refresh the list
        return data.data;
      } else {
        setError(data.error || 'Failed to create rule');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fetchRules]);

  // Update a rule
  const updateRule = useCallback(async (id: string, updates: UpdateRuleRequest): Promise<CustomRule | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data: RuleResponse = await response.json();
      
      if (data.success) {
        await fetchRules(); // Refresh the list
        return data.data;
      } else {
        setError(data.error || 'Failed to update rule');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fetchRules]);

  // Delete a rule
  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/rules/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchRules(); // Refresh the list
        return true;
      } else {
        setError(data.error || 'Failed to delete rule');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fetchRules]);

  // Toggle rule enabled/disabled
  const toggleRule = useCallback(async (id: string): Promise<boolean> => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return false;
    
    const updated = await updateRule(id, { enabled: !rule.enabled });
    return updated !== null;
  }, [rules, updateRule]);

  // Test a rule against HTML
  const testRule = useCallback(async (rule: CreateRuleRequest, html: string): Promise<RuleTestResponse['data'] | null> => {
    try {
      const response = await fetch(`${apiUrl}/rules/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule, html }),
      });
      const data: RuleTestResponse = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [apiUrl]);

  // Import rules from JSON
  const importRules = useCallback(async (rulesToImport: CustomRule[]): Promise<{ imported: number; total: number } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/rules/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: rulesToImport }),
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchRules(); // Refresh the list
        return data.data;
      } else {
        setError(data.error || 'Failed to import rules');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import rules');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fetchRules]);

  // Export all rules
  const exportRules = useCallback(async (): Promise<RuleExportResponse['data'] | null> => {
    try {
      const response = await fetch(`${apiUrl}/rules/export`);
      const data: RuleExportResponse = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [apiUrl]);

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    totalRules,
    enabledRules,
    fetchRules,
    getRule,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    importRules,
    exportRules,
  };
}