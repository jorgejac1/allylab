import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../config';

type JiraLinks = Record<string, string>;

export interface FindingsJiraResult {
  jiraLinks: JiraLinks;
  linkingFindingId: string | null;
  linkInput: string;
  getJiraLink: (findingId: string) => string | undefined;
  startLinking: (findingId: string) => void;
  cancelLinking: () => void;
  setLinkInput: (value: string) => void;
  saveLink: (findingId: string) => void;
  removeLink: (findingId: string) => void;
  getLinkedCount: (findingIds: string[]) => number;
}

export function useFindingsJira(): FindingsJiraResult {
  const [jiraLinks, setJiraLinks] = useLocalStorage<JiraLinks>(STORAGE_KEYS.JIRA_LINKS, {});
  const [linkingFindingId, setLinkingFindingId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState('');

  const getJiraLink = useCallback(
    (findingId: string) => jiraLinks[findingId],
    [jiraLinks]
  );

  const startLinking = useCallback((findingId: string) => {
    setLinkingFindingId(findingId);
    setLinkInput('');
  }, []);

  const cancelLinking = useCallback(() => {
    setLinkingFindingId(null);
    setLinkInput('');
  }, []);

  const saveLink = useCallback((findingId: string) => {
    if (linkInput.trim()) {
      setJiraLinks((prev) => ({
        ...prev,
        [findingId]: linkInput.trim().toUpperCase(),
      }));
    }
    setLinkingFindingId(null);
    setLinkInput('');
  }, [linkInput, setJiraLinks]);

  const removeLink = useCallback((findingId: string) => {
    setJiraLinks((prev) => {
      const next = { ...prev };
      delete next[findingId];
      return next;
    });
  }, [setJiraLinks]);

  const getLinkedCount = useCallback(
    (findingIds: string[]) => findingIds.filter((id) => jiraLinks[id]).length,
    [jiraLinks]
  );

  return {
    jiraLinks,
    linkingFindingId,
    linkInput,
    getJiraLink,
    startLinking,
    cancelLinking,
    setLinkInput,
    saveLink,
    removeLink,
    getLinkedCount,
  };
}
