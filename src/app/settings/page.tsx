'use client';
import { useState, FormEvent } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { useWebhookSubscriptions } from '@/hooks/useWebhookSubscriptions';
import type { WebhookEvent } from '@/services/api';
import styles from './settings.module.css';

const EVENT_OPTIONS: { value: WebhookEvent; label: string }[] = [
  { value: 'stream.created',   label: 'Stream created' },
  { value: 'stream.withdrawn', label: 'Stream withdrawn' },
  { value: 'stream.cancelled', label: 'Stream cancelled' },
];

export default function Settings() {
  const { address } = useWallet();
  const toast = useToast();
  const { subscriptions, subscribing, subscribe, unsubscribe } = useWebhookSubscriptions(address);

  const [url,          setUrl]          = useState('');
  const [events,       setEvents]       = useState<WebhookEvent[]>([]);
  const [urlError,     setUrlError]     = useState<string | null>(null);
  const [removingId,   setRemovingId]   = useState<string | null>(null);

  function toggleEvent(value: WebhookEvent) {
    setEvents(prev =>
      prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value],
    );
  }

  function validate(): boolean {
    if (!url.trim()) { setUrlError('Enter a webhook URL'); return false; }
    try {
      new URL(url);
    } catch {
      setUrlError('Enter a valid URL, e.g. https://example.com/hook');
      return false;
    }
    if (events.length === 0) { setUrlError('Pick at least one event'); return false; }
    setUrlError(null);
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await subscribe(url, events);
      toast.success('Webhook subscribed');
      setUrl('');
      setEvents([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to subscribe');
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await unsubscribe(id);
      toast.success('Webhook removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove webhook');
    } finally {
      setRemovingId(null);
    }
  }

  if (!address) {
    return (
      <div className={styles.page}>
        <p className={styles.notConnected}>Connect your wallet to manage notification settings.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notification Settings</h1>
      <p className={styles.subtitle}>
        Get a webhook call whenever something happens on one of your streams.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Webhook URL</span>
          <input
            className={urlError ? styles.inputError : styles.input}
            type="url"
            placeholder="https://example.com/webhooks/stellar"
            value={url}
            onChange={e => setUrl(e.target.value)}
            aria-describedby={urlError ? 'url-error' : undefined}
          />
          {urlError && <span id="url-error" className={styles.error}>{urlError}</span>}
        </label>

        <fieldset className={styles.eventsField}>
          <legend>Events</legend>
          {EVENT_OPTIONS.map(opt => (
            <label key={opt.value} className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={events.includes(opt.value)}
                onChange={() => toggleEvent(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>

        <button className={styles.submit} type="submit" disabled={subscribing}>
          {subscribing ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>

      <h2 className={styles.subheading}>Your subscriptions</h2>
      {subscriptions.length === 0 ? (
        <p className={styles.empty}>No webhook subscriptions yet.</p>
      ) : (
        <ul className={styles.list}>
          {subscriptions.map(sub => (
            <li key={sub.id} className={styles.card}>
              <div className={styles.cardMain}>
                <span className={styles.url}>{sub.url}</span>
                <span className={styles.eventTags}>
                  {sub.events.map(e => (
                    <span key={e} className={styles.tag}>{e}</span>
                  ))}
                </span>
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(sub.id)}
                disabled={removingId === sub.id}
              >
                {removingId === sub.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
