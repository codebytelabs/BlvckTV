import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Channel } from '@/types';
import { FALLBACK_CHANNELS, getCategoriesFrom, getCountriesFrom, getSportsChannelsFrom } from '@/lib/channels';
import { fetchPlaylistById, clearM3uCache, probeAllPlaylistsHealth } from '@/lib/m3uApi';
import {
  getActivePlaylistId,
  setActivePlaylistId as persistActivePlaylistId,
  getStoredPlaylists,
  getStreamHealthMap,
  type CustomPlaylist,
  type StreamHealthStatus,
} from '@/lib/customPlaylists';

export type ChannelsSource = 'm3u' | 'xstream' | 'cache' | 'fallback';

type LiveCatalogContextValue = {
  catalogId: string;
  setCatalogId: (id: string) => void;
  playlists: CustomPlaylist[];
  activePlaylist: CustomPlaylist | undefined;
  healthMap: Record<string, StreamHealthStatus>;
  checkStreamsHealth: () => Promise<void>;
  channels: Channel[];
  categories: string[];
  countries: string[];
  sportsChannels: Channel[];
  liveChannels: Channel[];
  loading: boolean;
  error: string | null;
  source: ChannelsSource;
  refetch: () => Promise<void>;
  refreshPlaylists: () => void;
};

const LiveCatalogContext = createContext<LiveCatalogContextValue | null>(null);

export function LiveCatalogProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>(() =>
    getStoredPlaylists().filter(p => p.enabled),
  );
  const [catalogId, setCatalogIdState] = useState<string>(() => getActivePlaylistId());
  const [healthMap, setHealthMap] = useState<Record<string, StreamHealthStatus>>(getStreamHealthMap);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ChannelsSource>('m3u');

  const refreshPlaylists = useCallback(() => {
    const all = getStoredPlaylists();
    const enabled = all.filter(p => p.enabled);
    setPlaylists(enabled);

    const activeId = getActivePlaylistId();
    if (!enabled.some(p => p.id === activeId) && enabled.length > 0) {
      persistActivePlaylistId(enabled[0].id);
      setCatalogIdState(enabled[0].id);
    } else {
      setCatalogIdState(activeId);
    }
  }, []);

  const checkStreamsHealth = useCallback(async () => {
    const all = getStoredPlaylists();
    await probeAllPlaylistsHealth(all);
    setHealthMap(getStreamHealthMap());
  }, []);

  useEffect(() => {
    const handlePlaylistsChange = () => {
      refreshPlaylists();
    };
    const handleActiveChange = () => {
      setCatalogIdState(getActivePlaylistId());
    };
    const handleHealthChange = () => {
      setHealthMap(getStreamHealthMap());
    };

    window.addEventListener('blvcktv_playlists_changed', handlePlaylistsChange);
    window.addEventListener('blvcktv_active_playlist_changed', handleActiveChange);
    window.addEventListener('blvcktv_stream_health_changed', handleHealthChange);
    return () => {
      window.removeEventListener('blvcktv_playlists_changed', handlePlaylistsChange);
      window.removeEventListener('blvcktv_active_playlist_changed', handleActiveChange);
      window.removeEventListener('blvcktv_stream_health_changed', handleHealthChange);
    };
  }, [refreshPlaylists]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkStreamsHealth();
    }, 1500);
    return () => clearTimeout(timer);
  }, [checkStreamsHealth]);

  const activePlaylist = useMemo(
    () => playlists.find(p => p.id === catalogId) ?? playlists[0],
    [playlists, catalogId],
  );

  const setCatalogId = useCallback((id: string) => {
    setLoading(true);
    setCatalogIdState(id);
    persistActivePlaylistId(id);
  }, []);

  const loadCatalog = useCallback(async (targetId: string, forceFresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchPlaylistById(targetId, forceFresh);
      if (res.channels.length > 0) {
        setChannels(res.channels);
        const p = playlists.find(item => item.id === targetId);
        setSource(res.fromCache ? 'cache' : (p?.type === 'xstream' ? 'xstream' : 'm3u'));
        setError(res.error ?? null);
      } else {
        setChannels([]);
        setSource('fallback');
        setError(res.error ?? 'No streams found in this playlist');
      }
    } catch {
      setChannels([]);
      setSource('fallback');
      setError('Could not load stream playlist — check URL or network connection');
    } finally {
      setLoading(false);
    }
  }, [playlists]);

  useEffect(() => {
    if (catalogId) {
      void loadCatalog(catalogId);
    }
  }, [catalogId, loadCatalog]);

  const refetch = useCallback(async () => {
    clearM3uCache(catalogId);
    await loadCatalog(catalogId, true);
  }, [catalogId, loadCatalog]);

  const categories = useMemo(() => getCategoriesFrom(channels), [channels]);
  const countries = useMemo(() => getCountriesFrom(channels), [channels]);
  const sportsChannels = useMemo(() => {
    const fromList = getSportsChannelsFrom(channels);
    if (fromList.length > 0) return fromList;
    return FALLBACK_CHANNELS.filter(c => c.category === 'Sports');
  }, [channels]);
  const liveChannels = useMemo(() => channels.filter(c => c.isLive), [channels]);

  const value = useMemo(
    (): LiveCatalogContextValue => ({
      catalogId,
      setCatalogId,
      playlists,
      activePlaylist,
      healthMap,
      checkStreamsHealth,
      channels,
      categories,
      countries,
      sportsChannels,
      liveChannels,
      loading,
      error,
      source,
      refetch,
      refreshPlaylists,
    }),
    [
      catalogId,
      setCatalogId,
      playlists,
      activePlaylist,
      healthMap,
      checkStreamsHealth,
      channels,
      categories,
      countries,
      sportsChannels,
      liveChannels,
      loading,
      error,
      source,
      refetch,
      refreshPlaylists,
    ],
  );

  return (
    <LiveCatalogContext.Provider value={value}>
      {children}
    </LiveCatalogContext.Provider>
  );
}

export function useLiveCatalog(): LiveCatalogContextValue {
  const ctx = useContext(LiveCatalogContext);
  if (!ctx) {
    throw new Error('useLiveCatalog must be used within LiveCatalogProvider');
  }
  return ctx;
}

export function useChannels(): Omit<LiveCatalogContextValue, 'catalogId' | 'setCatalogId'> {
  const {
    channels,
    categories,
    countries,
    sportsChannels,
    liveChannels,
    loading,
    error,
    source,
    refetch,
    playlists,
    activePlaylist,
    healthMap,
    checkStreamsHealth,
    refreshPlaylists,
  } = useLiveCatalog();
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
    playlists,
    activePlaylist,
    healthMap,
    checkStreamsHealth,
    refreshPlaylists,
  };
}
