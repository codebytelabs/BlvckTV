import type { Channel, ChannelProvider } from '@/types';

export type ParsedM3uEntry = {
  name: string;
  logo: string;
  group: string;
  country?: string;
  url: string;
};

type LiveTvCollectorJson = {
  date?: string;
  channels: Record<string, Array<{
    name: string;
    logo?: string;
    group?: string;
    url: string;
  }>>;
};

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function parseExtinfLine(line: string): { name: string; logo: string; group: string; country?: string } {
  const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
  const groupMatch = line.match(/group-title="([^"]*)"/i);
  const countryMatch = line.match(/tvg-country="([^"]*)"/i);
  const nameAttrMatch = line.match(/tvg-name="([^"]*)"/i);

  const commaIdx = line.lastIndexOf(',');
  let name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : '';
  if (!name && nameAttrMatch) {
    name = nameAttrMatch[1].trim();
  }
  if (!name) {
    name = 'Live Channel';
  }

  // Remove surrounding quotes if present
  name = name.replace(/^["']|["']$/g, '').trim();

  const group = groupMatch?.[1]?.trim() ?? 'General';
  const country = countryMatch?.[1]?.trim();

  return {
    name,
    logo: logoMatch?.[1]?.trim() ?? '',
    group,
    country,
  };
}

/** Parse standard #EXTM3U playlist text into channel entries. */
export function parseM3uText(text: string): ParsedM3uEntry[] {
  const lines = text.split(/\r?\n/);
  const entries: ParsedM3uEntry[] = [];
  let pending: { name: string; logo: string; group: string; country?: string } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      pending = parseExtinfLine(line);
      continue;
    }

    if (line.startsWith('#')) continue;

    if (!pending) continue;
    if (!/^https?:\/\//i.test(line)) {
      pending = null;
      continue;
    }

    entries.push({
      ...pending,
      url: line,
    });
    pending = null;
  }

  return entries;
}

/** Parse LiveTVCollector JSON export (grouped by category). */
export function parseLiveTvCollectorJson(text: string): ParsedM3uEntry[] {
  const data = JSON.parse(text) as LiveTvCollectorJson;
  const entries: ParsedM3uEntry[] = [];

  for (const [group, channels] of Object.entries(data.channels ?? {})) {
    for (const channel of channels) {
      if (!channel.url?.startsWith('http')) continue;
      entries.push({
        name: channel.name?.trim() || 'Unknown Channel',
        logo: channel.logo?.trim() ?? '',
        group: channel.group?.trim() || group,
        url: channel.url.trim(),
      });
    }
  }

  return entries;
}

export function toM3uChannels(
  entries: ParsedM3uEntry[],
  catalogId: string,
  fallbackCountry = 'Live',
  provider: ChannelProvider = 'm3u',
): Channel[] {
  const seen = new Set<string>();

  return entries
    .filter(entry => {
      const key = entry.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(entry => ({
      id: `m3u-${catalogId}-${hashString(entry.url)}`,
      name: entry.name,
      logo: entry.logo,
      category: entry.group || 'General',
      country: entry.country || fallbackCountry,
      isLive: true,
      streamUrl: entry.url,
      provider,
      m3uCatalogId: catalogId,
    }));
}
