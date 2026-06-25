import { getDirectPlayerUrl, getDlhdWrapperUrl } from '@/lib/dlhdPlayerUrls';

const PLAYER_SOURCES = [
  (id: string) => getDirectPlayerUrl(id),
  (id: string) => getDlhdWrapperUrl('watch', id),
  (id: string) => getDlhdWrapperUrl('player', id),
];

const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const ATOB_RE = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/;
const M3U8_RE = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/;

function parseM3u8FromHtml(html: string): string | null {
  const atobMatch = html.match(ATOB_RE);
  if (atobMatch) {
    try {
      const decoded = atob(atobMatch[1]);
      if (decoded.includes('.m3u8')) return decoded;
    } catch {
      // ignore bad base64
    }
  }
  const direct = html.match(M3U8_RE);
  return direct?.[0] ?? null;
}

function extractIframes(html: string): string[] {
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  IFRAME_RE.lastIndex = 0;
  while ((match = IFRAME_RE.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        Referer: 'https://dlhd.pk/',
        Accept: 'text/html',
      },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/** Resolve direct HLS URL from DLHD player pages (works in browser / Capacitor WebView). */
export async function resolveM3u8FromDlhd(channelId: string): Promise<string | null> {
  const id = channelId.replace(/\D/g, '') || channelId;
  const visited = new Set<string>();

  async function crawl(url: string, depth: number): Promise<string | null> {
    if (depth > 3 || visited.has(url)) return null;
    visited.add(url);

    const html = await fetchHtml(url);
    if (!html) return null;

    const direct = parseM3u8FromHtml(html);
    if (direct) return direct;

    for (const iframeUrl of extractIframes(html)) {
      const resolved = iframeUrl.startsWith('http')
        ? iframeUrl
        : new URL(iframeUrl, url).href;
      const nested = await crawl(resolved, depth + 1);
      if (nested) return nested;
    }
    return null;
  }

  for (const build of PLAYER_SOURCES) {
    const found = await crawl(build(id), 0);
    if (found) return found;
  }
  return null;
}
