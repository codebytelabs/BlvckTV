import type { StreamingSource } from '@/types';

export const SOURCES: { id: StreamingSource; name: string; description: string }[] = [
  { id: 'vidsrcto', name: 'VidSrc.to', description: 'Fast, reliable streams with subtitles' },
  { id: 'vidsync', name: 'Vidsync', description: 'TMDB embeds with auto-next and server picker' },
  { id: 'vidking', name: 'Vidking', description: 'Multiple servers including 4K' },
  { id: 'rivestream', name: 'RiveStream', description: 'Standard embed with good quality' },
  { id: 'rivestreamAgg', name: 'RiveStream Agg', description: 'Multi-source aggregator' },
  { id: 'rivestreamTorrent', name: 'RiveStream BT', description: 'Torrent-based streaming' },
  { id: 'vidsrcme', name: 'VidSrcMe', description: 'Mirror with custom subs support' },
];

export function getMovieEmbedUrl(source: StreamingSource, tmdbId: number | string): string {
  switch (source) {
    case 'vidsrcto':
      return `https://vidsrc.to/embed/movie/${tmdbId}`;
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
      return `https://vidsrc.to/embed/movie/${tmdbId}`;
  }
}

export function getTVEmbedUrl(
  source: StreamingSource,
  tmdbId: number | string,
  season?: number,
  episode?: number
): string {
  switch (source) {
    case 'vidsrcto': {
      if (season && episode) return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
      if (season) return `https://vidsrc.to/embed/tv/${tmdbId}/${season}`;
      return `https://vidsrc.to/embed/tv/${tmdbId}`;
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
      if (season && episode) return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
      return `https://vidsrc.to/embed/tv/${tmdbId}`;
    }
  }
}

const DLHD_BASE = 'https://dlhd.pk';

/** DLHD mirror paths — player/watch/plus most reliable. */
export const LIVE_CHANNEL_PATHS = ['player', 'watch', 'plus', 'casting', 'cast', 'stream'];

export const DEFAULT_LIVE_PATH = 'player';

/** Human-readable labels for DLHD mirror paths. */
export const LIVE_PATH_LABELS: Record<string, string> = {
  player: 'Player (recommended)',
  watch: 'Watch',
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
