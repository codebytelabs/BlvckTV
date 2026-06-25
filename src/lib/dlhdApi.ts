import type { Channel } from '@/types';

const DLHD_BASE = 'https://dlhd.pk';
const LOGO_BASE = `${DLHD_BASE}/logos/`;
const CACHE_KEY = 'blvcktv-dlhd-channels-v3';

export type DlhdRawChannel = {
  channel_id: string;
  channel_name: string;
  logo_url?: string;
  category?: string;
  country?: string;
};

type DlhdApiResponse = {
  success?: boolean;
  data?: DlhdRawChannel[];
  count?: number;
  error?: string;
  message?: string;
};

export type FetchChannelsResult = {
  channels: Channel[];
  source: 'api' | 'html' | 'cache';
};

const SPORTS_KEYWORDS = [
  'sport', 'espn', 'nfl', 'nba', 'mlb', 'nhl', 'golf', 'tennis', 'ufc', 'f1',
  'football', 'soccer', 'cricket', 'boxing', 'wwe', 'dazn', 'bein', 'sky sport',
  'bt sport', 'eurosport', 'fox sports', 'tnt sport', 'premier league', 'nba tv',
  'nfl network', 'mlb network', 'nhl network', 'supersport', 'arena sport',
];

const NEWS_KEYWORDS = ['news', 'cnn', 'msnbc', 'fox news', 'cnbc', 'bbc news', 'sky news'];

const KIDS_KEYWORDS = ['kids', 'cartoon', 'disney', 'nick', 'boomerang', 'nickelodeon', 'pbs kids'];

const MOVIES_KEYWORDS = ['hbo', 'cinemax', 'showtime', 'starz', 'movie', 'cinema', 'film'];

const MUSIC_KEYWORDS = ['mtv', 'vh1', 'music', 'cmusic'];

const DOC_KEYWORDS = [
  'discovery', 'national geographic', 'history', 'documentary', 'animal planet',
  'science channel', 'nat geo', 'ngc',
];

const COUNTRY_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /\b(usa|u\.s\.a\.?|united states)\b/i, code: 'US' },
  { pattern: /\b(uk|u\.k\.|united kingdom|britain)\b/i, code: 'UK' },
  { pattern: /\b(tsn\d?|sportsnet|ctv|global tv|cbc|tva|rds)\b/i, code: 'CA' },
  { pattern: /\b(canada|canadian)\b/i, code: 'CA' },
  { pattern: /\b(australia|au\b)/i, code: 'AU' },
  { pattern: /\b(germany|de\b|deutsch)/i, code: 'DE' },
  { pattern: /\b(france|fr\b)/i, code: 'FR' },
  { pattern: /\b(spain|es\b|espana)/i, code: 'ES' },
  { pattern: /\b(italy|it\b|italia)/i, code: 'IT' },
  { pattern: /\b(mexico|mx\b)/i, code: 'MX' },
  { pattern: /\b(brazil|br\b|brasil)/i, code: 'BR' },
  { pattern: /\b(india|in\b)/i, code: 'IN' },
  { pattern: /\b(arabic|mena|arab)\b/i, code: 'MENA' },
  { pattern: /\b(serbia|croatia|poland|greece|portugal|netherlands|nl\b)/i, code: 'EU' },
  { pattern: /\b(israel|il\b)/i, code: 'IL' },
  { pattern: /\b(philippines|ph\b)/i, code: 'PH' },
];

function resolveLogoUrl(logoUrl?: string): string {
  if (!logoUrl) return '';
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
  const path = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
  if (path.startsWith('logos/')) return `${DLHD_BASE}/${path}`;
  return `${LOGO_BASE}${path.replace(/^logos\//, '')}`;
}

function inferCategory(name: string, apiCategory?: string): string {
  if (apiCategory?.trim()) return apiCategory.trim();
  const lower = name.toLowerCase();
  if (SPORTS_KEYWORDS.some(k => lower.includes(k))) return 'Sports';
  if (NEWS_KEYWORDS.some(k => lower.includes(k))) return 'News';
  if (KIDS_KEYWORDS.some(k => lower.includes(k))) return 'Kids';
  if (MOVIES_KEYWORDS.some(k => lower.includes(k))) return 'Movies';
  if (MUSIC_KEYWORDS.some(k => lower.includes(k))) return 'Music';
  if (DOC_KEYWORDS.some(k => lower.includes(k))) return 'Documentary';
  return 'Entertainment';
}

function inferCountry(name: string, apiCountry?: string): string {
  if (apiCountry?.trim()) return apiCountry.trim().toUpperCase();
  for (const { pattern, code } of COUNTRY_PATTERNS) {
    if (pattern.test(name)) return code;
  }
  return 'INT';
}

export function mapDlhdChannel(raw: DlhdRawChannel): Channel {
  const id = String(raw.channel_id);
  return {
    id,
    name: raw.channel_name.trim(),
    logo: resolveLogoUrl(raw.logo_url),
    category: inferCategory(raw.channel_name, raw.category),
    country: inferCountry(raw.channel_name, raw.country),
    isLive: true,
    streamUrl: `${DLHD_BASE}/stream/stream-${id}.php`,
    altPaths: ['player', 'watch', 'plus', 'casting', 'cast', 'stream'],
  };
}

function getApiUrl(): string {
  if (import.meta.env.DEV) {
    return '/api/dlhd/channels';
  }
  const key = import.meta.env.VITE_DLHD_API_KEY;
  if (key) {
    return `${DLHD_BASE}/daddyapi.php?endpoint=channels&key=${encodeURIComponent(key)}`;
  }
  return `${DLHD_BASE}/24-7-channels.php`;
}

async function fetchFromProtectedApi(): Promise<Channel[]> {
  const url = getApiUrl();
  const isHtmlFallback = !import.meta.env.DEV && !import.meta.env.VITE_DLHD_API_KEY;

  if (isHtmlFallback) {
    return fetchFromChannelsPage();
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`DLHD API HTTP ${res.status}`);
  }

  const json = (await res.json()) as DlhdApiResponse | DlhdRawChannel[];

  if (Array.isArray(json)) {
    return json.map(mapDlhdChannel);
  }

  if (json.error || json.success === false) {
    throw new Error(json.message ?? json.error ?? 'DLHD API error');
  }

  const data = json.data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('DLHD API returned no channels');
  }

  return data.map(mapDlhdChannel);
}

const HTML_CHANNEL_RE =
  /<a class="card"[\s\S]*?href="\/watch\.php\?id=(\d+)"[\s\S]*?data-title="([^"]*)"[\s\S]*?<div class="card__title">([^<]+)<\/div>/gi;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchFromChannelsPage(): Promise<Channel[]> {
  const url = import.meta.env.DEV
    ? '/api/dlhd/channels-page'
    : `${DLHD_BASE}/24-7-channels.php`;

  const res = await fetch(url, { headers: { Accept: 'text/html' } });
  if (!res.ok) {
    throw new Error(`DLHD channels page HTTP ${res.status}`);
  }

  const html = await res.text();
  const channels: Channel[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  HTML_CHANNEL_RE.lastIndex = 0;
  while ((match = HTML_CHANNEL_RE.exec(html)) !== null) {
    const [, id, , titleRaw] = match;
    if (seen.has(id)) continue;
    seen.add(id);
    const name = decodeHtmlEntities(titleRaw.trim());
    channels.push(mapDlhdChannel({ channel_id: id, channel_name: name }));
  }

  if (channels.length === 0) {
    throw new Error('No channels parsed from DLHD page');
  }

  return channels;
}

function readSessionCache(): Channel[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { channels: Channel[]; expiresAt: number };
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.channels;
  } catch {
    return null;
  }
}

function writeSessionCache(channels: Channel[]): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ channels, expiresAt: Date.now() + 60 * 60 * 1000 }),
    );
  } catch {
    // ignore quota errors
  }
}

export async function fetchDlhdChannels(): Promise<FetchChannelsResult> {
  const cached = readSessionCache();
  if (cached?.length) {
    return { channels: cached, source: 'cache' };
  }

  try {
    const channels = await fetchFromProtectedApi();
    writeSessionCache(channels);
    return { channels, source: 'api' };
  } catch (apiError) {
    try {
      const channels = await fetchFromChannelsPage();
      writeSessionCache(channels);
      return { channels, source: 'html' };
    } catch (htmlError) {
      const apiMsg = apiError instanceof Error ? apiError.message : 'API failed';
      const htmlMsg = htmlError instanceof Error ? htmlError.message : 'HTML parse failed';
      throw new Error(`${apiMsg}; fallback: ${htmlMsg}`);
    }
  }
}

export function clearDlhdCache(): void {
  sessionStorage.removeItem(CACHE_KEY);
}
