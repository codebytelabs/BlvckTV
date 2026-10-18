import type { Channel } from '@/types';
import { type ResolvedLiveChannel } from '@/lib/liveChannelResolver';
import { getSportsChannelsFrom, SPORTS_CHANNELS } from '@/lib/channels';

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const BROADCASTER_SYNONYMS: Record<string, string[]> = {
  'fox sports': ['fox sports', 'fs1', 'fs2', 'fox sport', 'bein', 'sport'],
  fs1: ['fs1', 'fox sports 1', 'fox sports', 'sport'],
  'fox sports 1': ['fox sports 1', 'fs1', 'fox sports', 'sport'],
  telemundo: ['telemundo', 'tudn', 'bein', 'sport'],
  tsn1: ['tsn 1', 'tsn1', 'tsn', 'sport'],
  tsn: ['tsn', 'tsn 1', 'sport'],
  'bein sports': ['bein sports', 'bein sport', 'bein', 'sport'],
  'bein sports usa': ['bein sports', 'bein sport', 'bein', 'sport'],
  espn: ['espn', 'acc digital', 'sport'],
  'espn usa': ['espn', 'acc digital', 'sport'],
  'espn+': ['espn', 'acc digital', 'sport'],
  espn2: ['espn 2', 'espn2', 'espn', 'sport'],
  'sky sports': ['sky sports', 'sky sport', 'sport'],
  'sky sports main event': ['sky sports main event', 'sky sports', 'sport'],
  'nbc sports': ['nbc sports', 'nbc', 'usa network', 'sport'],
  peacock: ['peacock', 'nbc sports', 'sport'],
  tnt: ['tnt sports', 'tnt', 'sport'],
  'tnt sports': ['tnt sports', 'bt sport', 'sport'],
  cbs: ['cbs sports', 'cbs', 'sport'],
  'willow tv': ['willow', 'cricket', 'astro cricket', 'sport'],
  'golf channel': ['golf', 'sky sports golf', 'sport'],
  'tennis channel': ['tennis', 'sky sports tennis', 'sport'],
  eurosport: ['eurosport', 'sport'],
  dazn: ['dazn', 'sport'],
};

function scoreChannelMatch(queries: string[], channelName: string): number {
  const name = normalizeLabel(channelName);
  if (!name) return 0;
  let best = 0;
  for (let i = 0; i < queries.length; i += 1) {
    const q = normalizeLabel(queries[i]);
    if (!q) continue;
    const priorityBonus = Math.max(0, 20 - i * 4);
    if (name === q) best = Math.max(best, 100 + priorityBonus);
    else if (name.startsWith(q)) best = Math.max(best, 85 + priorityBonus);
    else if (name.includes(q)) best = Math.max(best, 70 + priorityBonus);
  }
  return best;
}

let cachedCatalogRef: Channel[] | null = null;
let cachedSportsPool: Channel[] = [];
let cachedResolutionMap = new Map<string, ResolvedLiveChannel>();

function getSportsPool(channels: Channel[]): Channel[] {
  if (cachedCatalogRef === channels && cachedSportsPool.length > 0) {
    return cachedSportsPool;
  }
  cachedCatalogRef = channels;
  cachedResolutionMap = new Map();
  const m3uSports = getSportsChannelsFrom(channels).filter(c => Boolean(c.streamUrl));
  cachedSportsPool = m3uSports.length > 0 ? m3uSports : SPORTS_CHANNELS;
  return cachedSportsPool;
}

export function resolveChannelIdByName(label: string, channels: Channel[]): string | undefined {
  const resolved = resolveSportsChannel({ channel: label }, channels);
  return resolved?.id;
}

export type ResolvedSportsChannel = ResolvedLiveChannel;

export function resolveSportsChannel(
  input: {
    channelId?: string;
    channel: string;
    channelName?: string;
  },
  channels: Channel[],
): ResolvedSportsChannel | null {
  const pool = getSportsPool(channels);
  const cacheKey = `${input.channel}|${input.channelName ?? ''}|${input.channelId ?? ''}`;
  const cached = cachedResolutionMap.get(cacheKey);
  if (cached) return cached;

  const normPrimary = normalizeLabel(input.channel);
  const normSecondary = normalizeLabel(input.channelName ?? '');
  const searchTerms = [
    ...(BROADCASTER_SYNONYMS[normPrimary] ?? []),
    ...(BROADCASTER_SYNONYMS[normSecondary] ?? []),
    normSecondary,
    normPrimary,
  ].filter(Boolean);

  let bestChannel: Channel | null = null;
  let bestScore = 0;

  const scanLimit = Math.min(pool.length, 600);
  for (let i = 0; i < scanLimit; i += 1) {
    const candidate = pool[i];
    if (!candidate.streamUrl) continue;
    const score = scoreChannelMatch(searchTerms, candidate.name);
    if (score > bestScore) {
      bestScore = score;
      bestChannel = candidate;
      if (score >= 115) break;
    }
  }

  if (!bestChannel) {
    const hash = cacheKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    bestChannel = pool[hash % pool.length] ?? SPORTS_CHANNELS[0];
  }

  if (!bestChannel) return null;

  const result: ResolvedLiveChannel = {
    id: bestChannel.id,
    name: `${input.channelName ?? input.channel} · ${bestChannel.name}`,
    logo: bestChannel.logo || '',
    streamUrl: bestChannel.streamUrl,
    provider: 'm3u',
  };

  cachedResolutionMap.set(cacheKey, result);
  return result;
}
