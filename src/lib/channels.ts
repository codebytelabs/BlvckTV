import type { Channel } from '@/types';

export type { Channel };

const DLHD = 'https://dlhd.pk';

function fb(id: string, name: string, category: string, country: string): Channel {
  return {
    id,
    name,
    logo: `${DLHD}/logos/${id}.png`,
    category,
    country,
    isLive: true,
    streamUrl: `${DLHD}/watch/stream-${id}.php`,
    altPaths: ['watch', 'player', 'plus', 'casting', 'cast', 'stream'],
  };
}

function fbSport(id: string, name: string, country: string, streamUrl: string, logo = ''): Channel {
  return {
    id: `m3u-sport-${id}`,
    name,
    logo,
    category: 'Sports',
    country,
    isLive: true,
    streamUrl,
    provider: 'm3u',
  };
}

/** Hardcoded fallback channels with working public HLS sports streams */
export const FALLBACK_CHANNELS: Channel[] = [
  fb('51', 'ABC', 'Entertainment', 'US'),
  fb('52', 'CBS', 'Entertainment', 'US'),
  fb('53', 'NBC', 'Entertainment', 'US'),
  fb('54', 'FOX', 'Entertainment', 'US'),
  fb('300', 'CW', 'Entertainment', 'US'),
  fbSport('espn', 'ESPN (ACC Network)', 'US', 'https://raycom-accdn-firetv.amagi.tv/playlist.m3u8'),
  fbSport('bein1', 'beIN Sports 1 HD', 'INT', 'https://andro.mangeinde4.lat/checklist/androstreamlivebs1.m3u8'),
  fbSport('aspor', 'A Spor HD', 'TR', 'https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8'),
  fbSport('bahrain1', 'Bahrain Sports 1 HD', 'MENA', 'https://5c7b683162943.streamlock.net/live/ngrp:sportsone_all/playlist.m3u8'),
  fbSport('bahrain2', 'Bahrain Sports 2 HD', 'MENA', 'https://5c7b683162943.streamlock.net/live/ngrp:bahrainsportstwo_all/playlist.m3u8'),
  fbSport('acisport', 'ACI Sport TV HD', 'IT', 'https://webstream.multistream.it/memfs/e2cb3629-c1a2-495b-b43a-9eb386f04ed8.m3u8'),
  fbSport('golf', '30A Golf Kingdom', 'US', 'https://30a-tv.com/feeds/vidaa/golf.m3u8'),
  fbSport('iraqia', 'Iraqia Sports HD', 'MENA', 'https://imn-live.esite-lab.com/hls/iraqia-sports-1.m3u8'),
  fbSport('as3', 'AS3 Sport TV', 'EU', 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8'),
  fbSport('atg', 'ATG Live Racing', 'SE', 'https://kanal75xto-llhls.akamaized.net/live/Data/atg-kanal-15-02a-rr/HLS-Legacy-HL/atg-kanal-15-02a-rr.m3u8'),
  fbSport('astrahan', 'Astrahan Sport HD', 'RU', 'https://streaming.astrakhan.ru/astrakhanrusporthd/playlist.m3u8'),
  fb('345', 'CNN', 'News', 'US'),
  fb('349', 'BBC News', 'News', 'UK'),
  fb('347', 'Fox News', 'News', 'US'),
  fb('327', 'MSNBC', 'News', 'US'),
  fb('339', 'Cartoon Network', 'Kids', 'US'),
  fb('312', 'Disney Channel', 'Kids', 'US'),
  fb('329', 'Nickelodeon', 'Kids', 'US'),
  fb('321', 'HBO', 'Movies', 'US'),
  fb('374', 'Cinemax', 'Movies', 'US'),
  fb('333', 'Showtime', 'Movies', 'US'),
  fb('367', 'MTV', 'Music', 'US'),
  fb('344', 'VH1', 'Music', 'US'),
  fb('311', 'Discovery', 'Documentary', 'US'),
  fb('328', 'National Geographic', 'Documentary', 'US'),
  fb('322', 'History Channel', 'Documentary', 'US'),
];

/** @deprecated Use useChannels() — kept for backwards compatibility */
export const CHANNELS = FALLBACK_CHANNELS;

export function getCategoriesFrom(channels: Channel[]): string[] {
  const set = new Set<string>();
  for (let i = 0; i < channels.length; i += 1) {
    const raw = channels[i].category;
    if (!raw) continue;
    if (raw.includes(';')) {
      const parts = raw.split(';');
      for (let j = 0; j < parts.length; j += 1) {
        const trimmed = parts[j].trim();
        if (trimmed) set.add(trimmed);
      }
    } else {
      const trimmed = raw.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function getCountriesFrom(channels: Channel[]): string[] {
  return [...new Set(channels.map(c => c.country))].sort();
}

const SPORTS_KEYWORD_RE =
  /\b(sports?|espn|bein|dazn|eurosport|sky\s*sports?|tnt\s*sports?|fox\s*sports?|fs1|fs2|tsn|nfl|nba|mlb|nhl|f1|formula\s*1|ufc|wwe|premier\s*league|epl|laliga|serie\s*a|bundesliga|ucl|champions\s*league|cricket|willow|tennis|golf|motorsport|football|soccer|boxing|racing|supersport|viaplay\s*sport|optus\s*sport|acc\s*digital)\b/i;

export function getSportsChannelsFrom(channels: Channel[]): Channel[] {
  const matched = channels.filter(
    c => SPORTS_KEYWORD_RE.test(c.category || '') || SPORTS_KEYWORD_RE.test(c.name || ''),
  );
  return matched.length > 0 ? matched : FALLBACK_CHANNELS.filter(c => c.category === 'Sports');
}

export const CATEGORIES = getCategoriesFrom(FALLBACK_CHANNELS);
export const COUNTRIES = getCountriesFrom(FALLBACK_CHANNELS);
export const SPORTS_CHANNELS = getSportsChannelsFrom(FALLBACK_CHANNELS);
