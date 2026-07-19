'use client';
import { useState, useEffect, useCallback } from 'react';
import { webhooksApi, type WebhookEvent, type WebhookSubscription } from '@/services/api';

// There's no GET /webhooks?address= on the backend yet, so subscriptions
// are tracked client-side per wallet address until that endpoint exists.
function storageKey(address: string) {
  return `webhook-subscriptions:${address}`;
}

function loadStored(address: string): WebhookSubscription[] {
  try {
    const raw = localStorage.getItem(storageKey(address));
    return raw ? (JSON.parse(raw) as WebhookSubscription[]) : [];
  } catch {
    return [];
  }
}

function saveStored(address: string, subs: WebhookSubscription[]) {
  localStorage.setItem(storageKey(address), JSON.stringify(subs));
}

interface UseWebhookSubscriptionsReturn {
  subscriptions: WebhookSubscription[];
  subscribing:   boolean;
  subscribe:     (url: string, events: WebhookEvent[]) => Promise<void>;
  unsubscribe:   (id: string) => Promise<void>;
}

export function useWebhookSubscriptions(address?: string | null): UseWebhookSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [subscribing,   setSubscribing]   = useState(false);

  useEffect(() => {
    setSubscriptions(address ? loadStored(address) : []);
  }, [address]);

  const subscribe = useCallback(async (url: string, events: WebhookEvent[]) => {
    if (!address) return;
    setSubscribing(true);
    try {
      const created = await webhooksApi.subscribe(url, events, address);
      setSubscriptions(prev => {
        const next = [...prev, created];
        saveStored(address, next);
        return next;
      });
    } finally {
      setSubscribing(false);
    }
  }, [address]);

  const unsubscribe = useCallback(async (id: string) => {
    if (!address) return;
    await webhooksApi.unsubscribe(id);
    setSubscriptions(prev => {
      const next = prev.filter(s => s.id !== id);
      saveStored(address, next);
      return next;
    });
  }, [address]);

  return { subscriptions, subscribing, subscribe, unsubscribe };
}
