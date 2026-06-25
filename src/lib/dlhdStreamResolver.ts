import { getLiveStreamUrl, LIVE_CHANNEL_PATHS, DEFAULT_LIVE_PATH } from '@/lib/streamingSources';

const SESSION_KEY = 'blvcktv-path-discovery-v1';
const STORAGE_KEY = 'blvcktv-channel-paths-v1';

type PathCache = Record<string, { paths: string[]; updatedAt: number }>;

function normalizeId(channelId: string): string {
  return channelId.replace(/\D/g, '') || channelId;
}

function readStorage(): PathCache {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as PathCache;
  } catch {
    return {};
  }
}

function writeStorage(cache: PathCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota
  }
}

function readSessionDiscovery(): PathCache {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}') as PathCache;
  } catch {
    return {};
  }
}

function writeSessionDiscovery(cache: PathCache): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function isValidStreamHtml(html: string): boolean {
  if (html.length < 200) return false;
  if (/404 not found|page could not be found/i.test(html) && !/<iframe/i.test(html)) return false;
  return /<iframe[^>]+src=["']https?:\/\//i.test(html);
}

async function fetchPathHtml(path: string, channelId: string): Promise<string | null> {
  const id = normalizeId(channelId);
  const url = import.meta.env.DEV
    ? `/api/dlhd/resolve?path=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`
    : `https://dlhd.pk/${path}/stream-${id}.php`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'text/html', Referer: 'https://dlhd.pk/' },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/** Probe which DLHD mirror paths serve a real player for this channel. */
export async function discoverPathsForChannel(channelId: string): Promise<string[]> {
  const id = normalizeId(channelId);
  const session = readSessionDiscovery();
  if (session[id]?.paths.length) return session[id].paths;

  const working: string[] = [];

  await Promise.all(
    LIVE_CHANNEL_PATHS.map(async path => {
      const html = await fetchPathHtml(path, channelId);
      if (html && isValidStreamHtml(html)) working.push(path);
    }),
  );

  const ordered = LIVE_CHANNEL_PATHS.filter(p => working.includes(p));
  const result = ordered.length > 0 ? ordered : ['player', 'watch', 'plus'];

  writeSessionDiscovery({ ...session, [id]: { paths: result, updatedAt: Date.now() } });
  return result;
}

export function getCachedPathsForChannel(channelId: string): string[] {
  const id = normalizeId(channelId);
  const session = readSessionDiscovery()[id]?.paths;
  if (session?.length) return session;

  const stored = readStorage()[id]?.paths;
  if (stored?.length) return stored;

  return ['player', 'watch', 'plus'];
}

export function markPathWorking(channelId: string, path: string): void {
  const id = normalizeId(channelId);
  const cache = readStorage();
  const existing = cache[id]?.paths ?? [];
  const merged = [...new Set([path, ...existing])].filter(p =>
    LIVE_CHANNEL_PATHS.includes(p),
  );
  merged.sort((a, b) => LIVE_CHANNEL_PATHS.indexOf(a) - LIVE_CHANNEL_PATHS.indexOf(b));
  cache[id] = { paths: merged, updatedAt: Date.now() };
  writeStorage(cache);

  const session = readSessionDiscovery();
  session[id] = { paths: merged, updatedAt: Date.now() };
  writeSessionDiscovery(session);
}

/**
 * Always use the DLHD wrapper page — never the direct third-party player URL.
 * Direct URLs cause "sandbox not allowed" and "access denied" errors.
 */
export function buildLivePlayerUrl(
  channelId: string,
  path: string,
  streamUrl?: string,
): string {
  return getLiveStreamUrl(channelId, path, streamUrl);
}

export function getPreferredPath(channelId: string): string {
  const cached = getCachedPathsForChannel(channelId);
  return cached[0] ?? DEFAULT_LIVE_PATH;
}

export function withAutoplay(url: string): string {
  if (url.includes('autoplay')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}autoplay=1`;
}

export { DEFAULT_LIVE_PATH, LIVE_CHANNEL_PATHS };
