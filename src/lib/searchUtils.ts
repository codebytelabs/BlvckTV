import type { Channel } from '@/types';

export function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, '');
}

export function channelMatchesQuery(channel: Channel, query: string): boolean {
  const nq = normalizeSearchQuery(query);
  if (!nq) return true;
  return (
    normalizeSearchQuery(channel.name).includes(nq) ||
    normalizeSearchQuery(channel.category).includes(nq)
  );
}

export function filterChannelsByQuery(channels: Channel[], query: string): Channel[] {
  if (!query.trim()) return channels;
  return channels.filter(c => channelMatchesQuery(c, query));
}
