import type { StreamingSource } from '@/types';

/** Default VOD source order (first = preferred). */
export const DEFAULT_SOURCE_PRIORITY: StreamingSource[] = [
  'vidsrcme',
  'vidsrcto',
  'vidking',
  'vidsync',
  'rivestream',
  'rivestreamAgg',
  'rivestreamTorrent',
];

/** vidsrc.to blocks/framed embeds often fail; vidsrc.pm is the active mirror (same API). */
const VIDSRC_EMBED_BASE = 'https://vidsrc.pm';

export const SOURCES: { id: StreamingSource; name: string; description: string }[] = [
  { id: 'vidsrcme', name: 'VidLink Pro', description: 'Fast HD/4K player with custom subs & auto-next' },
  { id: 'vidsrcto', name: 'VidSrc.pm', description: 'Reliable multi-mirror stream with subtitles' },
  { id: 'vidking', name: 'Videasy 4K', description: 'Clean multi-server player with 4K & episodes' },
  { id: 'vidsync', name: 'VidFast Pro', description: 'High-speed TMDB embed with server switcher' },
  { id: 'rivestream', name: 'VidSrc.su', description: 'Direct HLS embed with multi-language audio' },
  { id: 'rivestreamAgg', name: 'MultiEmbed', description: 'Multi-source VIP aggregator' },
  { id: 'rivestreamTorrent', name: '2Embed CC', description: 'Backup multi-server embed' },
];

type EmbedIds = {
  tmdbId: number | string;
  imdbId?: string | null;
};

function normalizeImdbId(imdbId?: string | null): string | null {
  if (!imdbId) return null;
  const trimmed = imdbId.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('tt') ? trimmed : `tt${trimmed}`;
}

/** VidSrc accepts TMDB numeric id or IMDb tt id — prefer IMDb when available. */
function vidsrcMediaId(ids: EmbedIds): string {
  return normalizeImdbId(ids.imdbId) ?? String(ids.tmdbId);
}

export function getMovieEmbedUrl(
  source: StreamingSource,
  tmdbId: number | string,
  imdbId?: string | null,
): string {
  const ids: EmbedIds = { tmdbId, imdbId };
  switch (source) {
    case 'vidsrcme':
      return `https://vidlink.pro/movie/${tmdbId}?primaryColor=8b5cf6&autoplay=true`;
    case 'vidsrcto':
      return `${VIDSRC_EMBED_BASE}/embed/movie/${vidsrcMediaId(ids)}`;
    case 'vidking':
      return `https://player.videasy.net/movie/${tmdbId}?color=8b5cf6`;
    case 'vidsync':
      return `https://vidfast.pro/movie/${tmdbId}?autoPlay=true`;
    case 'rivestream':
      return `https://vidsrc.su/embed/movie/${tmdbId}`;
    case 'rivestreamAgg':
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    case 'rivestreamTorrent':
      return `https://www.2embed.cc/embed/${tmdbId}`;
    default:
      return `https://vidlink.pro/movie/${tmdbId}?primaryColor=8b5cf6&autoplay=true`;
  }
}

export function getTVEmbedUrl(
  source: StreamingSource,
  tmdbId: number | string,
  season?: number,
  episode?: number,
  imdbId?: string | null,
): string {
  const ids: EmbedIds = { tmdbId, imdbId };
  const mediaId = vidsrcMediaId(ids);
  const s = season ?? 1;
  const e = episode ?? 1;
  switch (source) {
    case 'vidsrcme':
      return `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?primaryColor=8b5cf6&autoplay=true`;
    case 'vidsrcto':
      return `${VIDSRC_EMBED_BASE}/embed/tv/${mediaId}/${s}/${e}`;
    case 'vidking':
      return `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?color=8b5cf6`;
    case 'vidsync':
      return `https://vidfast.pro/tv/${tmdbId}/${s}/${e}?autoPlay=true`;
    case 'rivestream':
      return `https://vidsrc.su/embed/tv/${tmdbId}/${s}/${e}`;
    case 'rivestreamAgg':
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
    case 'rivestreamTorrent':
      return `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`;
    default:
      return `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?primaryColor=8b5cf6&autoplay=true`;
  }
}

const DLHD_BASE = 'https://dlhd.pk';

/** DLHD mirror paths — watch/player most reliable. */
export const LIVE_CHANNEL_PATHS = ['watch', 'player', 'plus', 'casting', 'cast', 'stream'] as const;

export type LiveChannelPath = (typeof LIVE_CHANNEL_PATHS)[number];

export const DEFAULT_LIVE_PATH: LiveChannelPath = 'watch';

/** Keep iframe servers in watch → player → rest order regardless of cache/probe order. */
export function sortLivePaths(paths: readonly string[]): LiveChannelPath[] {
  return LIVE_CHANNEL_PATHS.filter(p => paths.includes(p));
}

/** Human-readable labels for DLHD mirror paths. */
export const LIVE_PATH_LABELS: Record<string, string> = {
  watch: 'Watch (recommended)',
  player: 'Player',
  plus: 'Plus',
  casting: 'Casting',
  cast: 'Cast',
  stream: 'Stream',
};

export function getLiveStreamUrl(
  channelId: string,
  path: string = DEFAULT_LIVE_PATH,
  streamUrl?: string,
): string {
  if (streamUrl?.startsWith(DLHD_BASE)) {
    const match = streamUrl.match(/\/(stream|cast|watch|plus|casting|player)\/stream-\d+\.php$/);
    if (match && path === 'stream') return streamUrl;
  }

  const validPaths = ['stream', 'cast', 'watch', 'plus', 'casting', 'player'];
  const folder = validPaths.includes(path) ? path : DEFAULT_LIVE_PATH;
  const id = channelId.replace(/\D/g, '') || channelId;
  return `${DLHD_BASE}/${folder}/stream-${id}.php`;
}
