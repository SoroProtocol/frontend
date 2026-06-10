'use client';
import { useState, useEffect, useCallback } from 'react';
import { streamsApi, type ApiStream } from '@/services/api';

interface UseStreamsReturn {
  streams:  ApiStream[];
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

export function useStreams(address?: string | null): UseStreamsReturn {
  const [streams,  setStreams]  = useState<ApiStream[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const loadStreams = useCallback(async () => {
    if (!address) { setStreams([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await streamsApi.list(address);
      setStreams(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { void loadStreams(); }, [loadStreams]);

  return { streams, loading, error, refetch: loadStreams };
}

interface UseStreamReturn {
  stream:  ApiStream | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useStream(id: string | null): UseStreamReturn {
  const [stream,  setStream]  = useState<ApiStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const loadStream = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await streamsApi.get(id);
      setStream(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stream not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadStream(); }, [loadStream]);
  return { stream, loading, error, refetch: loadStream };
}
