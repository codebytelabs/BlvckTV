/** Hosts/patterns to block — ads, popunders, trackers (adapted from 1tube Android blocklist). */
const BLOCKED_HOSTS = new Set([
  'fubuki-umami.space',
  '92mim.com',
  'vr-gc.com',
  'tzegilo.com',
  'llvpn.com',
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'taboola.com',
  'outbrain.com',
  'adsterra.com',
  'propellerads.com',
  'popads.net',
  'exoclick.com',
  'clickadu.com',
  'cloudflareinsights.com',
  'rtmark.net',
  'my.rtmark.net',
  'venus.js',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'securepubads.g.doubleclick.net',
]);

const BLOCKED_PATTERNS = [
  /\/ads?\//i,
  /\/popunder/i,
  /\/pop-up/i,
  /\/banner/i,
  /\/vignette/i,
  /\/tracking/i,
  /\/pixel\.gif/i,
  /\/beacon/i,
  /click\.(php|aspx|html)/i,
  /\/af\.js/i,
  /\/pop\.js/i,
];

/** Stream / player hosts that must never be blocked. */
const ALLOWED_STREAM_HOSTS = [
  'dlhd.pk',
  'wikisport.info',
  'romponalis.st',
  'hamis.romponalis.st',
  'embed.sportshub.to',
  'sportshub.to',
  'embed.st',
  'vidsrc.to',
  'vidsrc.pm',
  'vidsrc.wiki',
  'vidsrc-embed.ru',
  'vidking.net',
  'vidsync.live',
  'rivestream.app',
  'vidup.to',
  'vidlink.pro',
  'vidrock.ru',
  'vidzee.wtf',
  'videasy.to',
  'vidsrc.wtf',
  'themoviedb.org',
  'image.tmdb.org',
  'iptv-org.github.io',
  'jsdelivr.net',
  'cdn.jsdelivr.net',
];

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isAllowedStreamHost(url: string): boolean {
  const host = hostnameFromUrl(url);
  if (!host) return false;
  return ALLOWED_STREAM_HOSTS.some(
    allowed => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function isBlockedUrl(url: string): boolean {
  if (!url || url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) {
    return false;
  }

  const host = hostnameFromUrl(url);
  if (host && isAllowedStreamHost(url)) return false;

  if (host) {
    for (const blocked of BLOCKED_HOSTS) {
      if (host === blocked || host.endsWith(`.${blocked}`)) return true;
    }
  }

  return BLOCKED_PATTERNS.some(pattern => pattern.test(url));
}

/** Pick the best player iframe from a DLHD wrapper page (skip ad iframes). */
export function isDlhdHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === 'dlhd.pk' || host.endsWith('.dlhd.pk');
  } catch {
    return false;
  }
}

export function pickBestPlayerIframe(candidates: string[]): string | null {
  const scored = candidates
    .filter(url => !isBlockedUrl(url) && !isDlhdHost(url))
    .map(url => {
      const lower = url.toLowerCase();
      let score = 1;
      if (/daddy\d*\.php|premiumtv|strm\/|\/embed\//i.test(lower)) score += 10;
      if (/wikisport|romponalis|embed\.st|sportshub/i.test(lower)) score += 8;
      if (/\.m3u8|\.mp4/i.test(lower)) score += 12;
      if (/ads|pop|banner|track/i.test(lower)) score -= 20;
      return { url, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.url ?? candidates.find(u => !isBlockedUrl(u) && !isDlhdHost(u)) ?? null;
}

/** Blocks in-iframe popups/tabs; unused — live embeds reject sandbox. Kept for reference. */
export const LIVE_IFRAME_SANDBOX =
  'allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-forms';

export const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
