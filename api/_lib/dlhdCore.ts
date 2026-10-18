/** Shared helpers for Vercel /api/dlhd/* and /api/m3u routes. */

export const DLHD_BASE = 'https://dlhd.pk';
export const DLHD_DIRECT_PLAYER = 'https://hamis.romponalis.st/premiumtv/daddy3.php';
export const VALID_PATHS = new Set(['watch', 'player', 'plus', 'casting', 'cast', 'stream']);

export const HLS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: `${DLHD_BASE}/`,
  Accept: '*/*',
};

export const HTML_HEADERS = {
  ...HLS_HEADERS,
  Accept: 'text/html,application/xhtml+xml,*/*',
};

export const M3U_ALLOWED_HOSTS = new Set([
  'raw.githubusercontent.com',
  'iptv-org.github.io',
  'github.io',
]);

const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const ATOB_RE = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/;
const M3U8_RE = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/;

export function normalizeId(id: string): string {
  return id.replace(/\D/g, '') || id;
}

export function getDirectPlayerUrl(id: string): string {
  return `${DLHD_DIRECT_PLAYER}?id=${normalizeId(id)}`;
}

export function getWrapperUrl(path: string, id: string): string {
  return `${DLHD_BASE}/${path}/stream-${normalizeId(id)}.php`;
}

export function q(req: { query?: Record<string, string | string[] | undefined> }, key: string, fallback = ''): string {
  const v = req.query?.[key];
  if (Array.isArray(v)) return String(v[0] ?? fallback);
  return String(v ?? fallback);
}

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HTML_HEADERS });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

function parseM3u8FromHtml(html: string): string | null {
  const atobMatch = html.match(ATOB_RE);
  if (atobMatch) {
    try {
      const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf8');
      if (decoded.includes('.m3u8')) return decoded;
    } catch {
      // ignore
    }
  }
  return html.match(M3U8_RE)?.[0] ?? null;
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

const PLAYER_SOURCES = [
  (id: string) => getDirectPlayerUrl(id),
  (id: string) => getWrapperUrl('watch', id),
  (id: string) => getWrapperUrl('player', id),
  (id: string) => getWrapperUrl('plus', id),
];

export async function resolveM3u8(channelId: string): Promise<string | null> {
  const id = normalizeId(channelId);
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

export function rewriteManifest(body: string, baseUrl: string): string {
  const base = baseUrl.endsWith('/')
    ? baseUrl
    : `${baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1)}`;
  return body
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const absolute = trimmed.startsWith('http')
        ? trimmed
        : new URL(trimmed, base).href;
      return `/api/dlhd/segment?url=${encodeURIComponent(absolute)}`;
    })
    .join('\n');
}

export function isPlayablePlayerHtml(html: string): boolean {
  return (
    /<iframe[^>]+src=["']https?:\/\//i.test(html) ||
    /new Clappr\.Player/i.test(html) ||
    /Hls\.isSupported/i.test(html)
  );
}

const POPUP_BLOCK = `<script>(function(){var o=window.open;window.open=function(){return null};})();</script>`;

export function injectPopupBlock(html: string): string {
  if (html.includes('</head>')) {
    return html.replace('</head>', `${POPUP_BLOCK}</head>`);
  }
  return POPUP_BLOCK + html;
}

function buildEmbedFramePage(embedUrl: string): string {
  const safeSrc = embedUrl.replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live</title>
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
${POPUP_BLOCK}
</head><body>
<iframe src="${safeSrc}" allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *" referrerpolicy="no-referrer"></iframe>
</body></html>`;
}

function buildHlsFramePlayer(id: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live</title>
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}video{width:100%;height:100%;object-fit:contain}</style>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"><\/script>
${POPUP_BLOCK}
</head><body>
<video id="v" playsinline autoplay muted></video>
<script>
(async function(){
  try {
    var playlistUrl = '/api/dlhd/playlist?id=${id}';
    var v = document.getElementById('v');
    if (window.Hls && Hls.isSupported()) {
      var hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hls.loadSource(playlistUrl);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, function(){ v.play().catch(function(){}); });
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = playlistUrl;
      v.play().catch(function(){});
    }
  } catch (e) {
    document.body.innerHTML='<p style="color:#aaa;text-align:center;padding:2rem">Stream unavailable</p>';
  }
})();
<\/script></body></html>`;
}

export async function fetchStreamPageHtml(path: string, id: string): Promise<string> {
  const wrapperUrl = getWrapperUrl(path, id);
  const wrapperHtml = await fetchHtml(wrapperUrl);

  if (wrapperHtml && isPlayablePlayerHtml(wrapperHtml)) {
    return wrapperHtml;
  }
  if (wrapperHtml !== null) {
    return buildEmbedFramePage(wrapperUrl);
  }

  const playerHtml = await fetchHtml(getDirectPlayerUrl(id));
  if (playerHtml && isPlayablePlayerHtml(playerHtml)) {
    return playerHtml;
  }
  return buildHlsFramePlayer(normalizeId(id));
}

export function isAllowedM3uHost(hostname: string): boolean {
  if (M3U_ALLOWED_HOSTS.has(hostname)) return true;
  return hostname.endsWith('.github.io');
}

export type VercelRes = {
  status: (code: number) => VercelRes;
  setHeader: (k: string, v: string) => void;
  send: (body?: string | Buffer) => void;
  json: (body: unknown) => void;
  end: (body?: string | Buffer) => void;
};

export type VercelReq = {
  query?: Record<string, string | string[] | undefined>;
};
