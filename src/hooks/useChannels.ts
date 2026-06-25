import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Channel } from '@/types';
import { FALLBACK_CHANNELS, getCategoriesFrom, getCountriesFrom, getSportsChannelsFrom } from '@/lib/channels';
import { fetchDlhdChannels, clearDlhdCache } from '@/lib/dlhdApi';

export type ChannelsSource = 'api' | 'html' | 'cache' | 'fallback';

export type UseChannelsResult = {
  channels: Channel[];
  categories: string[];
  countries: string[];
  sportsChannels: Channel[];
  liveChannels: Channel[];
  loading: boolean;
  error: string | null;
  source: ChannelsSource;
  refetch: () => Promise<void>;
};

type ChannelCache = {
  channels: Channel[];
  source: ChannelsSource;
};

let memoryCache: ChannelCache | null = null;
let inflight: Promise<ChannelCache> | null = null;

async function resolveChannels(force = false): Promise<ChannelCache> {
  if (!force && memoryCache) {
    return memoryCache;
  }

  if (!force && inflight) {
    return inflight;
  }

  inflight = (async (): Promise<ChannelCache> => {
    try {
      const result = await fetchDlhdChannels();
      const cached: ChannelCache = { channels: result.channels, source: result.source };
      memoryCache = cached;
      return cached;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load channels';
      throw new Error(message);
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function useChannels(): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>(
    () => memoryCache?.channels ?? FALLBACK_CHANNELS,
  );
  const [loading, setLoading] = useState(!memoryCache);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ChannelsSource>(
    () => memoryCache?.source ?? 'fallback',
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (memoryCache) {
        setChannels(memoryCache.channels);
        setSource(memoryCache.source);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await resolveChannels();
        if (cancelled) return;
        setChannels(result.channels);
        setSource(result.source);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load channels';
        setChannels(FALLBACK_CHANNELS);
        setSource('fallback');
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    clearDlhdCache();
    memoryCache = null;
    inflight = null;

    try {
      const result = await resolveChannels(true);
      setChannels(result.channels);
      setSource(result.source);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reload channels';
      setChannels(FALLBACK_CHANNELS);
      setSource('fallback');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const categories = useMemo(() => getCategoriesFrom(channels), [channels]);
  const countries = useMemo(() => getCountriesFrom(channels), [channels]);
  const sportsChannels = useMemo(() => getSportsChannelsFrom(channels), [channels]);
  const liveChannels = useMemo(() => channels.filter(c => c.isLive), [channels]);

  return {
    channels,
    categories,
    countries,
    sportsChannels,
    liveChannels,
    loading,
    error,
    source,
    refetch,
  };
}
