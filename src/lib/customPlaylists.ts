export type PlaylistType = 'm3u' | 'xstream';
export type StreamHealthStatus = 'online' | 'offline' | 'checking';

export interface CustomPlaylist {
  id: string;
  name: string;
  type: PlaylistType;
  url: string;
  serverUrl?: string;
  username?: string;
  password?: string;
  outputFormat?: 'ts' | 'm3u8';
  enabled: boolean;
  isDefault?: boolean;
  createdAt: number;
}

export const DEFAULT_PLAYLISTS: CustomPlaylist[] = [
  {
    id: 'default-iptv-org',
    name: 'IPTV-org (Worldwide)',
    type: 'm3u',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    enabled: true,
    isDefault: true,
    createdAt: 1,
  },
  // --- InfinityTV (infinitytv-mgm.online) ---
  {
    id: 'default-infinity-1',
    name: 'InfinityTV 1 (11PP3TY)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=11PP3TY&password=NDGKPSJ&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '11PP3TY',
    password: 'NDGKPSJ',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 2,
  },
  {
    id: 'default-infinity-3',
    name: 'InfinityTV 3 (13CF1A2)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=13cf1a2a73115d1&password=haxvy9hofu&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '13CF1A2A73115D1',
    password: 'hAxvy9hofu',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 3,
  },
  {
    id: 'default-infinity-4',
    name: 'InfinityTV 4 (1406627)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=140662723428643&password=9693802739&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '140662723428643',
    password: '9693802739',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 4,
  },
  // --- Magnike (magnike.com) ---
  {
    id: 'default-magnike-2',
    name: 'Magnike 2 (2565577)',
    type: 'xstream',
    url: 'http://magnike.com/get.php?username=2565577063&password=5453357205&type=m3u_plus',
    serverUrl: 'http://magnike.com',
    username: '2565577063',
    password: '5453357205',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 5,
  },
  {
    id: 'default-magnike-3',
    name: 'Magnike 3 (2902703)',
    type: 'xstream',
    url: 'http://magnike.com/get.php?username=2902703229&password=2173458651&type=m3u_plus',
    serverUrl: 'http://magnike.com',
    username: '2902703229',
    password: '2173458651',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 6,
  },
  {
    id: 'default-magnike-4',
    name: 'Magnike 4 (2SATX8JX)',
    type: 'xstream',
    url: 'http://magnike.com/get.php?username=2SATX8JX&password=Y18L8G23&type=m3u_plus',
    serverUrl: 'http://magnike.com',
    username: '2SATX8JX',
    password: 'Y18L8G23',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 7,
  },
  // --- PhantomZoo (phantomzoo.online) ---
  {
    id: 'default-phantom-5',
    name: 'PhantomZoo 5 (cprfrptool)',
    type: 'xstream',
    url: 'http://phantomzoo.online:80/get.php?username=cprfrptool%40&password=7155973782&type=m3u_plus&output=m3u8',
    serverUrl: 'http://phantomzoo.online:80',
    username: 'cprfrptool@',
    password: '7155973782',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 8,
  },
  {
    id: 'default-phantom-1',
    name: 'PhantomZoo 1 (87654321)',
    type: 'xstream',
    url: 'http://phantomzoo.online:80/get.php?username=87654321&password=87654321&type=m3u_plus&output=m3u8',
    serverUrl: 'http://phantomzoo.online:80',
    username: '87654321',
    password: '87654321',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 9,
  },
  {
    id: 'default-phantom-2',
    name: 'PhantomZoo 2 (bigscooter)',
    type: 'xstream',
    url: 'http://phantomzoo.online:80/get.php?username=bigscooter1017%40gmail.com&password=RRrt4PRmNT&type=m3u_plus&output=m3u8',
    serverUrl: 'http://phantomzoo.online:80',
    username: 'bigscooter1017@gmail.com',
    password: 'RRrt4PRmNT',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 10,
  },
  {
    id: 'default-phantom-3',
    name: 'PhantomZoo 3 (brad)',
    type: 'xstream',
    url: 'http://phantomzoo.online:80/get.php?username=brad&password=brad&type=m3u_plus&output=m3u8',
    serverUrl: 'http://phantomzoo.online:80',
    username: 'brad',
    password: 'brad',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 11,
  },
  {
    id: 'default-phantom-4',
    name: 'PhantomZoo 4 (Charles)',
    type: 'xstream',
    url: 'http://phantomzoo.online:80/get.php?username=Charles&password=1234&type=m3u_plus&output=m3u8',
    serverUrl: 'http://phantomzoo.online:80',
    username: 'Charles',
    password: '1234',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 12,
  },
  // --- Remaining Magnike ---
  {
    id: 'default-magnike-1',
    name: 'Magnike 1 (1750040)',
    type: 'xstream',
    url: 'http://magnike.com/get.php?username=1750040736&password=2451168445&type=m3u_plus',
    serverUrl: 'http://magnike.com',
    username: '1750040736',
    password: '2451168445',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 13,
  },
  {
    id: 'default-magnike-5',
    name: 'Magnike 5 (3003126)',
    type: 'xstream',
    url: 'http://magnike.com/get.php?username=3003126827&password=3432645201&type=m3u_plus',
    serverUrl: 'http://magnike.com',
    username: '3003126827',
    password: '3432645201',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 14,
  },
  // --- Remaining InfinityTV ---
  {
    id: 'default-infinity-2',
    name: 'InfinityTV 2 (132882D)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=132882DA79288D3&password=zhuYWVLfqB&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '132882DA79288D3',
    password: 'zhuYWVLfqB',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 15,
  },
  {
    id: 'default-infinity-5',
    name: 'InfinityTV 5 (1472870)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=1472870781733517&password=7F0A390BF521&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '1472870781733517',
    password: '7F0A390BF521',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 16,
  },
  {
    id: 'default-infinity-6',
    name: 'InfinityTV 6 (17C5485)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=17C5485C8CF47D4&password=nAnngtwCrK&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '17C5485C8CF47D4',
    password: 'nAnngtwCrK',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 17,
  },
  {
    id: 'default-infinity-7',
    name: 'InfinityTV 7 (1C26231)',
    type: 'xstream',
    url: 'http://infinitytv-mgm.online:80/get.php?username=1C262312189565F&password=76IsgbAAfC&type=m3u_plus&output=m3u8',
    serverUrl: 'http://infinitytv-mgm.online:80',
    username: '1C262312189565F',
    password: '76IsgbAAfC',
    outputFormat: 'm3u8',
    enabled: true,
    isDefault: true,
    createdAt: 18,
  },
  // --- Atlas Pro ---
  {
    id: 'default-atlaspro-1',
    name: 'Atlas Pro 1 (035f898)',
    type: 'xstream',
    url: 'http://line.atlaspro4k.me:80/get.php?username=035f898130&password=98a342a28fb0&type=m3u_plus',
    serverUrl: 'http://line.atlaspro4k.me:80',
    username: '035f898130',
    password: '98a342a28fb0',
    outputFormat: 'ts',
    enabled: true,
    isDefault: true,
    createdAt: 19,
  },
  {
    id: 'default-atlaspro-2',
    name: 'Atlas Pro 2 (0c1f92b)',
    type: 'xstream',
    url: 'http://line.atlaspro4k.me:80/get.php?username=0c1f92b1c9&password=e85604c9a31e&type=m3u_plus',
    serverUrl: 'http://line.atlaspro4k.me:80',
    username: '0c1f92b1c9',
    password: 'e85604c9a31e',
    outputFormat: 'ts',
    enabled: true,
    isDefault: true,
    createdAt: 20,
  },
  {
    id: 'default-atlaspro-3',
    name: 'Atlas Pro 3 (16132c1)',
    type: 'xstream',
    url: 'http://line.atlaspro4k.me:80/get.php?username=16132c147d&password=1bd6d3f1c4c9&type=m3u_plus',
    serverUrl: 'http://line.atlaspro4k.me:80',
    username: '16132c147d',
    password: '1bd6d3f1c4c9',
    outputFormat: 'ts',
    enabled: true,
    isDefault: true,
    createdAt: 21,
  },
  {
    id: 'default-atlaspro-4',
    name: 'Atlas Pro 4 (31531c3)',
    type: 'xstream',
    url: 'http://line.atlaspro4k.me:80/get.php?username=31531c3d9b&password=2091e80a6c23&type=m3u_plus',
    serverUrl: 'http://line.atlaspro4k.me:80',
    username: '31531c3d9b',
    password: '2091e80a6c23',
    outputFormat: 'ts',
    enabled: true,
    isDefault: true,
    createdAt: 22,
  },
  {
    id: 'default-atlaspro-5',
    name: 'Atlas Pro 5 (3401ef2)',
    type: 'xstream',
    url: 'http://line.atlaspro4k.me:80/get.php?username=3401ef2847&password=d224c3b50597&type=m3u_plus',
    serverUrl: 'http://line.atlaspro4k.me:80',
    username: '3401ef2847',
    password: 'd224c3b50597',
    outputFormat: 'ts',
    enabled: true,
    isDefault: true,
    createdAt: 23,
  },
  {
    id: 'default-atlaspro-6',
    name: 'Atlas Pro 6 (3675327)',
    type: 'xstream',
    url: 'http://line.atlaspro4k.me:80/get.php?username=3675327130&password=49f38d0cd70e&type=m3u_plus',
    serverUrl: 'http://line.atlaspro4k.me:80',
    username: '3675327130',
    password: '49f38d0cd70e',
    outputFormat: 'ts',
    enabled: true,
    isDefault: true,
    createdAt: 24,
  },
];

const PLAYLISTS_STORAGE_KEY = 'blvcktv_custom_playlists_v5';
const ACTIVE_PLAYLIST_STORAGE_KEY = 'blvcktv_active_playlist_id_v5';
const HEALTH_STORAGE_KEY = 'blvcktv_stream_health_v2';

export const INITIAL_HEALTH_MAP: Record<string, StreamHealthStatus> = {
  'default-iptv-org': 'online',
  'default-infinity-1': 'online',
  'default-infinity-3': 'online',
  'default-infinity-4': 'online',
  'default-magnike-2': 'online',
  'default-magnike-3': 'online',
  'default-magnike-4': 'online',
  'default-phantom-5': 'online',
  'default-phantom-1': 'offline',
  'default-phantom-2': 'offline',
  'default-phantom-3': 'offline',
  'default-phantom-4': 'offline',
  'default-magnike-1': 'offline',
  'default-magnike-5': 'offline',
  'default-infinity-2': 'offline',
  'default-infinity-5': 'offline',
  'default-infinity-6': 'offline',
  'default-infinity-7': 'offline',
  'default-atlaspro-1': 'offline',
  'default-atlaspro-2': 'online',
  'default-atlaspro-3': 'offline',
  'default-atlaspro-4': 'offline',
  'default-atlaspro-5': 'offline',
  'default-atlaspro-6': 'offline',
};

export function normalizePlaylistUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\/github\.com\/iptv-org\/iptv(\/)?$/i.test(trimmed)) {
    return 'https://iptv-org.github.io/iptv/index.m3u';
  }
  if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
    return trimmed.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }
  return trimmed;
}

export function buildXtreamUrl(
  server: string,
  user: string,
  pass: string,
  output: 'ts' | 'm3u8' = 'ts',
): string {
  const cleanServer = server.trim().replace(/\/+$/, '');
  const prefix = cleanServer.startsWith('http://') || cleanServer.startsWith('https://')
    ? cleanServer
    : `http://${cleanServer}`;
  return `${prefix}/get.php?username=${encodeURIComponent(user.trim())}&password=${encodeURIComponent(pass.trim())}&type=m3u_plus&output=${output}`;
}

export function parseXtreamUrl(url: string): {
  serverUrl: string;
  username: string;
  password: string;
  outputFormat: 'ts' | 'm3u8';
} | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes('get.php') && !parsed.pathname.includes('player_api.php')) return null;
    const user = parsed.searchParams.get('username') || '';
    const pass = parsed.searchParams.get('password') || '';
    const output = (parsed.searchParams.get('output') === 'm3u8' ? 'm3u8' : 'ts') as 'ts' | 'm3u8';
    return {
      serverUrl: `${parsed.protocol}//${parsed.host}`,
      username: user,
      password: pass,
      outputFormat: output,
    };
  } catch {
    return null;
  }
}

export function getStreamHealthMap(): Record<string, StreamHealthStatus> {
  try {
    const raw = localStorage.getItem(HEALTH_STORAGE_KEY);
    if (raw) {
      return { ...INITIAL_HEALTH_MAP, ...(JSON.parse(raw) as Record<string, StreamHealthStatus>) };
    }
  } catch {
    // ignore
  }
  return { ...INITIAL_HEALTH_MAP };
}

export function setStreamHealth(id: string, status: StreamHealthStatus): void {
  try {
    const map = getStreamHealthMap();
    if (map[id] === status) return;
    map[id] = status;
    localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('blvcktv_stream_health_changed', { detail: { id, status } }));
  } catch {
    // ignore
  }
}

export function getStoredPlaylists(): CustomPlaylist[] {
  try {
    const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CustomPlaylist[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migration from v2/v3/v4: keep any user-added playlists
    const oldV4 = localStorage.getItem('blvcktv_custom_playlists_v4');
    const oldV3 = localStorage.getItem('blvcktv_custom_playlists_v3');
    const oldV2 = localStorage.getItem('blvcktv_custom_playlists_v2');
    const prev = oldV4 ? JSON.parse(oldV4) : oldV3 ? JSON.parse(oldV3) : oldV2 ? JSON.parse(oldV2) : null;

    if (Array.isArray(prev)) {
      const userAdded = prev.filter((p: CustomPlaylist) => !p.isDefault && !p.id.startsWith('default-'));
      const merged = [...DEFAULT_PLAYLISTS, ...userAdded];
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(DEFAULT_PLAYLISTS));
  } catch {
    // ignore
  }
  return DEFAULT_PLAYLISTS;
}

export function saveStoredPlaylists(playlists: CustomPlaylist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    window.dispatchEvent(new Event('blvcktv_playlists_changed'));
  } catch {
    // ignore
  }
}

export function getActivePlaylistId(): string {
  try {
    const stored = localStorage.getItem(ACTIVE_PLAYLIST_STORAGE_KEY);
    const playlists = getStoredPlaylists();
    if (stored && playlists.some(p => p.id === stored && p.enabled)) {
      return stored;
    }
    const firstEnabled = playlists.find(p => p.enabled);
    if (firstEnabled) {
      return firstEnabled.id;
    }
    if (playlists.length > 0) {
      return playlists[0].id;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PLAYLISTS[0].id;
}

export function setActivePlaylistId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PLAYLIST_STORAGE_KEY, id);
    window.dispatchEvent(new Event('blvcktv_active_playlist_changed'));
  } catch {
    // ignore
  }
}

export function addCustomPlaylist(
  item: Omit<CustomPlaylist, 'id' | 'createdAt'>,
): CustomPlaylist {
  const playlists = getStoredPlaylists();
  const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const normalizedUrl = normalizePlaylistUrl(item.url);

  let serverUrl = item.serverUrl;
  let username = item.username;
  let password = item.password;
  let outputFormat = item.outputFormat;

  if (item.type === 'xstream' && (!serverUrl || !username)) {
    const xtreamParts = parseXtreamUrl(normalizedUrl);
    if (xtreamParts) {
      serverUrl = xtreamParts.serverUrl;
      username = xtreamParts.username;
      password = xtreamParts.password;
      outputFormat = xtreamParts.outputFormat;
    }
  }

  const newPlaylist: CustomPlaylist = {
    ...item,
    id,
    url: normalizedUrl,
    serverUrl,
    username,
    password,
    outputFormat: outputFormat ?? 'ts',
    createdAt: Date.now(),
  };

  playlists.push(newPlaylist);
  saveStoredPlaylists(playlists);
  return newPlaylist;
}

export function updateCustomPlaylist(
  id: string,
  updates: Partial<Omit<CustomPlaylist, 'id'>>,
): void {
  const playlists = getStoredPlaylists();
  const idx = playlists.findIndex(p => p.id === id);
  if (idx === -1) return;

  const current = playlists[idx];
  const url = updates.url ? normalizePlaylistUrl(updates.url) : current.url;

  playlists[idx] = {
    ...current,
    ...updates,
    url,
  };

  saveStoredPlaylists(playlists);
}

export function deleteCustomPlaylist(id: string): void {
  const playlists = getStoredPlaylists().filter(p => p.id !== id);
  saveStoredPlaylists(playlists);

  const activeId = getActivePlaylistId();
  if (activeId === id) {
    const next = playlists.find(p => p.enabled) ?? playlists[0];
    if (next) {
      setActivePlaylistId(next.id);
    }
  }
}

export function resetToDefaultPlaylists(): CustomPlaylist[] {
  saveStoredPlaylists(DEFAULT_PLAYLISTS);
  setActivePlaylistId(DEFAULT_PLAYLISTS[0].id);
  return DEFAULT_PLAYLISTS;
}
