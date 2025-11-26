import { useState, useEffect, useCallback } from 'react';
import { getApiBase } from '../utils/api';
import type { Webhook, WebhookEvent, WebhookType } from '../types/webhook';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/webhooks`);
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data);
      }
    } catch {
      setError('Failed to fetch webhooks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (
    name: string,
    url: string,
    events: WebhookEvent[],
    secret?: string,
    type?: WebhookType
  ): Promise<Webhook | null> => {
    try {
      const response = await fetch(`${getApiBase()}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, events, secret, type }),
      });
      if (response.ok) {
        const webhook = await response.json();
        setWebhooks(prev => [...prev, webhook]);
        return webhook;
      }
    } catch {
      setError('Failed to create webhook');
    }
    return null;
  };

  const updateWebhook = async (
    id: string,
    updates: Partial<Webhook>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiBase()}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updated = await response.json();
        setWebhooks(prev => prev.map(wh => (wh.id === id ? updated : wh)));
        return true;
      }
    } catch {
      setError('Failed to update webhook');
    }
    return false;
  };

  const deleteWebhook = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiBase()}/webhooks/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWebhooks(prev => prev.filter(wh => wh.id !== id));
        return true;
      }
    } catch {
      setError('Failed to delete webhook');
    }
    return false;
  };

  const testWebhook = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${getApiBase()}/webhooks/${id}/test`, {
        method: 'POST',
      });
      return await response.json();
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  return {
    webhooks,
    isLoading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    refresh: fetchWebhooks,
  };
}