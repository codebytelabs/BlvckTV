import type { StreamingSource } from '@/types';

/** Default VOD source order (first = preferred). */
export const DEFAULT_SOURCE_PRIORITY: StreamingSource[] = [
  'vidsrcme',
  'vidking',
  'vidsrcto',
  'vidsync',
  'rivestream',
  'rivestreamAgg',
  'rivestreamTorrent',
];

/** vidsrc.to blocks/framed embeds often fail; vidsrc.pm is the active mirror (same API). */
const VIDSRC_EMBED_BASE = 'https://vidsrc.pm';

export const SOURCES: { id: StreamingSource; name: string; description: string }[] = [
  { id: 'vidsrcme', name: 'VidSrcMe', description: 'Mirror with custom subs support' },
  { id: 'vidking', name: 'Vidking', description: 'Multiple servers including 4K' },
  { id: 'vidsrcto', name: 'VidSrc.to', description: 'Fast streams with subtitles (vidsrc.pm mirror)' },
  { id: 'vidsync', name: 'Vidsync', description: 'TMDB embeds with auto-next and server picker' },
  { id: 'rivestream', name: 'RiveStream', description: 'Standard embed with good quality' },
  { id: 'rivestreamAgg', name: 'RiveStream Agg', description: 'Multi-source aggregator' },
  { id: 'rivestreamTorrent', name: 'RiveStream BT', description: 'Torrent-based streaming' },
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
    case 'vidsrcto':
      return `${VIDSRC_EMBED_BASE}/embed/movie/${vidsrcMediaId(ids)}`;
    case 'vidking':
      return `https://www.vidking.net/embed/movie/${tmdbId}`;
    case 'vidsync':
      return `https://vidsync.live/embed/movie/${tmdbId}`;
    case 'rivestream':
      return `https://www.rivestream.app/embed?type=movie&id=${tmdbId}`;
    case 'rivestreamAgg':
      return `https://www.rivestream.app/embed/agg?type=movie&id=${tmdbId}`;
    case 'rivestreamTorrent':
      return `https://www.rivestream.app/embed/torrent?type=movie&id=${tmdbId}`;
    case 'vidsrcme':
      return `https://vidsrc-embed.ru/embed/movie?tmdb=${tmdbId}`;
    default:
      return `${VIDSRC_EMBED_BASE}/embed/movie/${vidsrcMediaId(ids)}`;
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
  switch (source) {
    case 'vidsrcto': {
      if (season != null && episode != null) {
        return `${VIDSRC_EMBED_BASE}/embed/tv/${mediaId}/${season}/${episode}`;
      }
      if (season != null) return `${VIDSRC_EMBED_BASE}/embed/tv/${mediaId}/${season}`;
      return `${VIDSRC_EMBED_BASE}/embed/tv/${mediaId}`;
    }
    case 'vidking': {
      if (season && episode) return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}`;
      return `https://www.vidking.net/embed/tv/${tmdbId}`;
    }
    case 'vidsync': {
      if (season && episode) return `https://vidsync.live/embed/tv/${tmdbId}/${season}/${episode}`;
      return `https://vidsync.live/embed/tv/${tmdbId}`;
    }
    case 'rivestream': {
      if (season && episode) return `https://www.rivestream.app/embed?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
      return `https://www.rivestream.app/embed?type=tv&id=${tmdbId}`;
    }
    case 'rivestreamAgg': {
      if (season && episode) return `https://www.rivestream.app/embed/agg?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
      return `https://www.rivestream.app/embed/agg?type=tv&id=${tmdbId}`;
    }
    case 'rivestreamTorrent': {
      if (season && episode) return `https://www.rivestream.app/embed/torrent?type=tv&id=${tmdbId}&season=${season}&episode=${episode}`;
      return `https://www.rivestream.app/embed/torrent?type=tv&id=${tmdbId}`;
    }
    case 'vidsrcme': {
      if (season && episode) return `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
      return `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdbId}`;
    }
    default: {
      if (season != null && episode != null) {
        return `${VIDSRC_EMBED_BASE}/embed/tv/${mediaId}/${season}/${episode}`;
      }
      return `${VIDSRC_EMBED_BASE}/embed/tv/${mediaId}`;
    }
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
