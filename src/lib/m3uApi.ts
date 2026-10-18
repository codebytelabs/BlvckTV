import type { Channel } from '@/types';
import {
  parseLiveTvCollectorJson,
  parseM3uText,
  toM3uChannels,
} from '@/lib/m3uParser';
import { getM3uCatalog } from '@/lib/m3uCatalogs';
import {
  getStoredPlaylists,
  parseXtreamUrl,
  setStreamHealth,
  type CustomPlaylist,
  type StreamHealthStatus,
} from '@/lib/customPlaylists';
import { readPersistentCache, writePersistentCache, removePersistentCache } from '@/lib/persistentCache';
import { useLiveApiProxy } from '@/lib/liveApiProxy';
import { platformFetchText } from '@/lib/platformHttp';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cacheKey = (id: string) => `blvcktv_m3u_v3_${id}`;

export function playlistFetchUrl(sourceUrl: string): string {
  if (useLiveApiProxy()) {
    return `/api/m3u?url=${encodeURIComponent(sourceUrl)}`;
  }
  return sourceUrl;
}

export function wrapStreamPlaybackUrl(rawStreamUrl: string): string {
  if (!rawStreamUrl) return rawStreamUrl;
  if (rawStreamUrl.startsWith('/api/m3u-stream')) return rawStreamUrl;
  if (useLiveApiProxy() && rawStreamUrl.startsWith('http://')) {
    return `/api/m3u-stream?url=${encodeURIComponent(rawStreamUrl)}`;
  }
  return rawStreamUrl;
}

/** Probe whether an M3U stream URL responds before playback (optional fast check). */
export async function probeM3uStream(streamUrl: string): Promise<boolean> {
  if (!streamUrl.startsWith('http')) return false;

  try {
    if (useLiveApiProxy()) {
      const res = await fetch(`/api/m3u-probe?url=${encodeURIComponent(streamUrl)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return true;
      const data = (await res.json()) as { ok?: boolean };
      return data.ok !== false;
    }
  } catch {
    // ignore
  }

  return true;
}

export async function probePlaylistHealth(
  playlist: CustomPlaylist,
): Promise<{ status: StreamHealthStatus; reason?: string }> {
  if (!playlist.url?.startsWith('http')) {
    setStreamHealth(playlist.id, 'offline');
    return { status: 'offline', reason: 'Invalid URL' };
  }

  try {
    if (useLiveApiProxy()) {
      const res = await fetch(`/api/m3u-probe?url=${encodeURIComponent(playlist.url)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; reason?: string };
        const status: StreamHealthStatus = data.ok ? 'online' : 'offline';
        setStreamHealth(playlist.id, status);
        return { status, reason: data.reason };
      }
    } else {
      const text = await platformFetchText(playlist.url);
      const isOk = Boolean(text && (text.includes('#EXT') || text.includes('{')));
      const status: StreamHealthStatus = isOk ? 'online' : 'offline';
      setStreamHealth(playlist.id, status);
      return { status };
    }
  } catch {
    // ignore
  }

  setStreamHealth(playlist.id, 'offline');
  return { status: 'offline', reason: 'Unreachable' };
}

export async function probeAllPlaylistsHealth(
  playlists: CustomPlaylist[],
): Promise<void> {
  await Promise.allSettled(playlists.map(p => probePlaylistHealth(p)));
}

export async function fetchPlaylistText(sourceUrl: string): Promise<string | null> {
  if (!useLiveApiProxy()) {
    return platformFetchText(sourceUrl);
  }

  const isDirectFriendly =
    sourceUrl.includes('iptv-org.github.io') ||
    sourceUrl.includes('raw.githubusercontent.com');

  if (isDirectFriendly) {
    try {
      const directRes = await fetch(sourceUrl, {
        headers: { Accept: 'text/plain, application/json, */*' },
        cache: 'no-store',
      });
      if (directRes.ok) {
        const text = await directRes.text();
        if (text && (text.includes('#EXTM3U') || text.includes('http') || text.includes('{'))) {
          return text;
        }
      }
    } catch {
      // fall through to proxy
    }
  }

  // Web Proxy (/api/m3u?url=...) — uses IPTVSmartersPro User-Agent for Xtream servers
  try {
    const proxyUrl = `/api/m3u?url=${encodeURIComponent(sourceUrl)}`;
    const proxyRes = await fetch(proxyUrl, {
      headers: { Accept: 'text/plain, application/json, */*' },
      cache: 'no-store',
    });
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      if (text && !text.includes('Upstream fetch failed')) {
        return text;
      }
    }
  } catch {
    // proxy failed
  }

  if (!isDirectFriendly) {
    try {
      const directRes = await fetch(sourceUrl, {
        headers: { Accept: 'text/plain, application/json, */*' },
        cache: 'no-store',
      });
      if (directRes.ok) {
        return await directRes.text();
      }
    } catch {
      // ignore
    }
  }

  return platformFetchText(sourceUrl);
}

export type M3uFetchResult = {
  channels: Channel[];
  catalogId: string;
  fromCache: boolean;
  offline: boolean;
  error?: string | null;
};

export async function fetchPlaylistById(
  id: string,
  forceFresh = false,
): Promise<M3uFetchResult> {
  const playlists = getStoredPlaylists();
  const playlist = playlists.find(p => p.id === id);

  if (playlist) {
    return fetchCustomPlaylistChannels(playlist, forceFresh);
  }

  const legacyId = id.replace(/^m3u:/, '');
  const legacy = getM3uCatalog(legacyId);
  if (legacy) {
    return fetchLegacyCatalog(legacy, forceFresh);
  }

  return {
    channels: [],
    catalogId: id,
    fromCache: false,
    offline: true,
    error: 'Playlist not found',
  };
}

export async function fetchCustomPlaylistChannels(
  playlist: CustomPlaylist,
  forceFresh = false,
): Promise<M3uFetchResult> {
  const key = cacheKey(playlist.id);

  if (!forceFresh) {
    const cached = readPersistentCache<Channel[]>(key);
    if (cached && cached.length > 0) {
      void refreshPlaylistInBackground(playlist);
      return {
        channels: cached,
        catalogId: playlist.id,
        fromCache: true,
        offline: false,
      };
    }
  }

  return loadPlaylistChannels(playlist);
}

async function refreshPlaylistInBackground(playlist: CustomPlaylist): Promise<void> {
  try {
    const result = await loadPlaylistChannels(playlist);
    if (result.channels.length > 0 && !result.offline) {
      writePersistentCache(cacheKey(playlist.id), result.channels, CACHE_TTL_MS);
    }
  } catch {
    // background refresh fails silently
  }
}

type XtreamCategoryItem = {
  category_id?: string | number;
  category_name?: string;
};

type XtreamStreamItem = {
  stream_id?: number | string;
  name?: string;
  stream_icon?: string;
  category_id?: string | number;
};

async function loadXtreamViaPlayerApi(
  playlist: CustomPlaylist,
  serverUrl: string,
  username: string,
  password: string,
): Promise<M3uFetchResult | null> {
  const cleanServer = serverUrl.trim().replace(/\/+$/, '');
  const authUrl = `${cleanServer}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  const authText = await fetchPlaylistText(authUrl);
  if (!authText || !authText.trim().startsWith('{')) {
    return null;
  }

  try {
    const authData = JSON.parse(authText) as {
      user_info?: {
        username?: string;
        password?: string;
        auth?: number | string;
        status?: string;
        active_cons?: number | string;
        max_connections?: number | string;
      };
    };

    const ui = authData?.user_info;
    if (!ui || Number(ui.auth) !== 1) {
      setStreamHealth(playlist.id, 'offline');
      return {
        channels: [],
        catalogId: playlist.id,
        fromCache: false,
        offline: true,
        error: 'Xtream authentication failed — invalid username or password.',
      };
    }

    if (ui.status && ui.status !== 'Active') {
      setStreamHealth(playlist.id, 'offline');
      return {
        channels: [],
        catalogId: playlist.id,
        fromCache: false,
        offline: true,
        error: `Xtream account is ${ui.status}. Select an Online 🟢 stream from the dropdown.`,
      };
    }

    const canonicalUser = ui.username || username;
    const canonicalPass = ui.password || password;
    const activeCons = Number(ui.active_cons ?? 0);
    const maxCons = Number(ui.max_connections ?? 1);
    const isBusy = maxCons > 0 && activeCons >= maxCons;

    const catsUrl = `${cleanServer}/player_api.php?username=${encodeURIComponent(canonicalUser)}&password=${encodeURIComponent(canonicalPass)}&action=get_live_categories`;
    const streamsUrl = `${cleanServer}/player_api.php?username=${encodeURIComponent(canonicalUser)}&password=${encodeURIComponent(canonicalPass)}&action=get_live_streams`;

    const [catsText, streamsText] = await Promise.all([
      fetchPlaylistText(catsUrl),
      fetchPlaylistText(streamsUrl),
    ]);

    if (!streamsText || !streamsText.trim().startsWith('[')) {
      return null;
    }

    const catMap = new Map<string, string>();
    if (catsText && catsText.trim().startsWith('[')) {
      try {
        const parsedCats = JSON.parse(catsText) as XtreamCategoryItem[];
        for (const c of parsedCats) {
          if (c.category_id != null && c.category_name) {
            catMap.set(String(c.category_id), c.category_name.trim());
          }
        }
      } catch {
        // ignore category parse failure
      }
    }

    const parsedStreams = JSON.parse(streamsText) as XtreamStreamItem[];
    const channels: Channel[] = [];

    for (const s of parsedStreams) {
      if (!s.stream_id || !s.name) continue;
      const cleanName = s.name.trim();
      // Skip pure separator banners like ##### FORMULA 1 #####
      if (/^[#=*-\s]+$/.test(cleanName) || /^#{3,}/.test(cleanName)) continue;

      const rawCategory = s.category_id != null ? (catMap.get(String(s.category_id)) ?? 'Live TV') : 'Live TV';
      const countryMatch = rawCategory.match(/^([A-Z]{2,3})\s*[|: -]/);
      const country = countryMatch ? countryMatch[1] : 'Xtream';

      const rawStreamUrl = `${cleanServer}/live/${canonicalUser}/${canonicalPass}/${s.stream_id}.m3u8`;
      const streamUrl = wrapStreamPlaybackUrl(rawStreamUrl);

      channels.push({
        id: `m3u-${playlist.id}-${s.stream_id}`,
        name: cleanName,
        logo: s.stream_icon?.trim() || '',
        category: rawCategory,
        country,
        isLive: true,
        streamUrl,
        provider: 'm3u',
        m3uCatalogId: playlist.id,
      });
    }

    if (channels.length > 0) {
      setStreamHealth(playlist.id, isBusy ? 'offline' : 'online');
      writePersistentCache(cacheKey(playlist.id), channels, CACHE_TTL_MS);
    } else {
      setStreamHealth(playlist.id, 'offline');
    }

    return {
      channels,
      catalogId: playlist.id,
      fromCache: false,
      offline: channels.length === 0,
      error:
        channels.length === 0
          ? 'No live channels found on this Xtream account.'
          : isBusy
            ? `Account currently at max connections (${activeCons}/${maxCons} in use). Channels loaded, but playback may require switching to an Online 🟢 stream.`
            : null,
    };
  } catch {
    return null;
  }
}

async function loadPlaylistChannels(playlist: CustomPlaylist): Promise<M3uFetchResult> {
  const parsedXtream =
    playlist.serverUrl && playlist.username && playlist.password
      ? {
          serverUrl: playlist.serverUrl,
          username: playlist.username,
          password: playlist.password,
        }
      : parseXtreamUrl(playlist.url);

  if (playlist.type === 'xstream' || parsedXtream) {
    if (parsedXtream) {
      const xtreamResult = await loadXtreamViaPlayerApi(
        playlist,
        parsedXtream.serverUrl,
        parsedXtream.username,
        parsedXtream.password,
      );
      if (xtreamResult) {
        if (xtreamResult.channels.length === 0) {
          const cached = readPersistentCache<Channel[]>(cacheKey(playlist.id));
          if (cached?.length) {
            return {
              ...xtreamResult,
              channels: cached,
              fromCache: true,
              offline: false,
            };
          }
        }
        return xtreamResult;
      }
    }
  }

  const text = await fetchPlaylistText(playlist.url);

  if (!text) {
    setStreamHealth(playlist.id, 'offline');
    const cached = readPersistentCache<Channel[]>(cacheKey(playlist.id));
    return {
      channels: cached ?? [],
      catalogId: playlist.id,
      fromCache: Boolean(cached?.length),
      offline: !cached?.length,
      error: cached?.length
        ? 'Using cached channels — stream server unreachable'
        : 'Stream server offline or account expired. Select an Online 🟢 stream from the dropdown.',
    };
  }

  try {
    const entries = parseM3uText(text);
    const channels = toM3uChannels(
      entries,
      playlist.id,
      playlist.type === 'xstream' ? 'Xtream' : 'IPTV',
      'm3u',
    );

    if (channels.length > 0) {
      setStreamHealth(playlist.id, 'online');
      writePersistentCache(cacheKey(playlist.id), channels, CACHE_TTL_MS);
    } else {
      setStreamHealth(playlist.id, 'offline');
    }

    return {
      channels,
      catalogId: playlist.id,
      fromCache: false,
      offline: channels.length === 0,
      error: channels.length === 0 ? 'No channels found in playlist' : null,
    };
  } catch {
    setStreamHealth(playlist.id, 'offline');
    const cached = readPersistentCache<Channel[]>(cacheKey(playlist.id));
    return {
      channels: cached ?? [],
      catalogId: playlist.id,
      fromCache: Boolean(cached?.length),
      offline: !cached?.length,
      error: 'Failed to parse playlist file',
    };
  }
}

async function fetchLegacyCatalog(
  catalog: ReturnType<typeof getM3uCatalog> & object,
  forceFresh = false,
): Promise<M3uFetchResult> {
  const key = cacheKey(catalog.id);

  if (!forceFresh) {
    const cached = readPersistentCache<Channel[]>(key);
    if (cached?.length) {
      return { channels: cached, catalogId: catalog.id, fromCache: true, offline: false };
    }
  }

  const text = await fetchPlaylistText(catalog.url);
  if (!text) {
    const cached = readPersistentCache<Channel[]>(key);
    return {
      channels: cached ?? [],
      catalogId: catalog.id,
      fromCache: Boolean(cached?.length),
      offline: !cached?.length,
    };
  }

  try {
    const entries = catalog.format === 'json'
      ? parseLiveTvCollectorJson(text)
      : parseM3uText(text);

    const channels = toM3uChannels(entries, catalog.id, catalog.country);
    if (channels.length > 0) {
      writePersistentCache(key, channels, CACHE_TTL_MS);
    }
    return { channels, catalogId: catalog.id, fromCache: false, offline: false };
  } catch {
    const cached = readPersistentCache<Channel[]>(key);
    return {
      channels: cached ?? [],
      catalogId: catalog.id,
      fromCache: Boolean(cached?.length),
      offline: !cached?.length,
    };
  }
}

/** Legacy signature for existing code */
export async function fetchM3uCatalog(catalogId: string): Promise<M3uFetchResult> {
  return fetchPlaylistById(catalogId);
}

export function clearM3uCache(catalogId?: string): void {
  if (catalogId) {
    removePersistentCache(cacheKey(catalogId));
    removePersistentCache(`blvcktv_m3u_v1_${catalogId}`);
    return;
  }
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('blvcktv_m3u_') || key.startsWith('blvcktv_playlist_')) {
      localStorage.removeItem(key);
    }
  }
}
