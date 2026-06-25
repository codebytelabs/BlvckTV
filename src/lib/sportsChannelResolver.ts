import type { Channel } from '@/types';

/** Known DLHD ids for common broadcaster labels used in sports schedules. */
const BROADCAST_IDS: Record<string, string> = {
  'fox sports': '39',
  fs1: '39',
  'fox sports 1': '39',
  telemundo: '131',
  tsn1: '111',
  tsn: '111',
  'bein sports': '425',
  'bein sports usa': '425',
  espn: '44',
  'espn usa': '44',
  'espn+': '44',
  espn2: '45',
  'sky sports': '38',
  'sky sports main event': '38',
  'nbc sports': '753',
  peacock: '343',
  tnt: '338',
  'tnt sports': '31',
  cbs: '52',
  'cbs sports': '308',
  cbssn: '308',
  'willow tv': '346',
  willow: '346',
  'nfl network': '405',
  'nba tv': '404',
  'mlb network': '399',
  'nhl network': '663',
  'golf channel': '318',
  'tennis channel': '40',
  eurosport: '231',
  dazn: '230',
  'usa network': '343',
};

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreChannelMatch(query: string, channelName: string): number {
  const q = normalizeLabel(query);
  const name = normalizeLabel(channelName);
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  const qTokens = q.split(' ').filter(Boolean);
  const matched = qTokens.filter(t => name.includes(t)).length;
  return matched >= 2 ? 40 + matched * 5 : 0;
}

export function resolveChannelIdByName(label: string, channels: Channel[]): string | undefined {
  const normalized = normalizeLabel(label);
  if (!normalized) return undefined;

  if (BROADCAST_IDS[normalized]) return BROADCAST_IDS[normalized];

  for (const [key, id] of Object.entries(BROADCAST_IDS)) {
    if (normalized.includes(key) || key.includes(normalized)) return id;
  }

  let best: { id: string; score: number } | null = null;
  for (const channel of channels) {
    const score = scoreChannelMatch(label, channel.name);
    if (!best || score > best.score) {
      best = { id: channel.id, score };
    }
  }

  return best && best.score >= 60 ? best.id : undefined;
}

export type ResolvedSportsChannel = {
  id: string;
  name: string;
  logo: string;
  streamUrl?: string;
};

export function resolveSportsChannel(
  input: {
    channelId?: string;
    channel: string;
    channelName?: string;
  },
  channels: Channel[],
): ResolvedSportsChannel | null {
  const displayName = input.channelName ?? input.channel;

  if (input.channelId) {
    const matched = channels.find(c => c.id === input.channelId);
    return {
      id: input.channelId,
      name: displayName,
      logo: matched?.logo ?? '',
      streamUrl: matched?.streamUrl,
    };
  }

  const resolvedId = resolveChannelIdByName(input.channel, channels);
  if (!resolvedId) return null;

  const matched = channels.find(c => c.id === resolvedId);
  return {
    id: resolvedId,
    name: matched?.name ?? displayName,
    logo: matched?.logo ?? '',
    streamUrl: matched?.streamUrl,
  };
}
