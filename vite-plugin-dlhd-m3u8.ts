import type { Plugin } from 'vite';
import { crawlInnerEmbedForPath } from './src/lib/dlhdInnerEmbed';
import {
  getDirectPlayerUrl,
  getDlhdWrapperUrl,
} from './src/lib/dlhdPlayerUrls';

const PLAYER_SOURCES = [
  (id: string) => getDirectPlayerUrl(id),
  (id: string) => getDlhdWrapperUrl('watch', id),
  (id: string) => getDlhdWrapperUrl('player', id),
];

const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const ATOB_RE = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/;
const M3U8_RE = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/;

const VALID_PATHS = new Set(['watch', 'player', 'plus', 'casting', 'cast', 'stream']);

const POPUP_BLOCK_SCRIPT = `<script>(function(){var o=window.open;window.open=function(){return null};})();</script>`;

function parseM3u8FromHtml(html: string): string | null {
  const atobMatch = html.match(ATOB_RE);
  if (atobMatch) {
    try {
      const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf8');
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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
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

function buildHlsFramePlayer(id: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live</title>
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}video{width:100%;height:100%;object-fit:contain}</style>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"><\/script>
${POPUP_BLOCK_SCRIPT}
</head><body>
<video id="v" playsinline autoplay muted></video>
<script>
(async function(){
  try {
    var res = await fetch('/api/dlhd/m3u8?id=${id}', { cache: 'no-store' });
    var data = await res.json();
    if (!data.url) throw new Error('no stream');
    var v = document.getElementById('v');
    if (window.Hls && Hls.isSupported()) {
      var hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hls.loadSource(data.url);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, function(){ v.play().catch(function(){}); });
      hls.on(Hls.Events.ERROR, function(ev, d){
        if (d.fatal) document.body.innerHTML='<p style="color:#aaa;text-align:center;padding:2rem">Stream unavailable</p>';
      });
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = data.url;
      v.play().catch(function(){});
    } else {
      throw new Error('no hls support');
    }
  } catch (e) {
    document.body.innerHTML='<p style="color:#aaa;text-align:center;padding:2rem">Stream unavailable</p>';
  }
})();
<\/script></body></html>`;
}

function isDlhdIframeWrapper(html: string): boolean {
  return /<iframe[^>]+src=["']https?:\/\//i.test(html);
}

/**
 * Path-specific DLHD wrapper when the mirror serves an iframe embed.
 * When dlhd.pk is down, use buildHlsFramePlayer so m3u8 is fetched fresh
 * (daddy3 Clappr pages embed signed URLs that expire immediately).
 */
async function fetchStreamPageHtml(path: string, id: string): Promise<string | null> {
  const wrapperHtml = await fetchHtml(getDlhdWrapperUrl(path, id));
  if (wrapperHtml && isDlhdIframeWrapper(wrapperHtml)) {
    return wrapperHtml;
  }

  return buildHlsFramePlayer(id);
}

function injectPopupBlock(html: string): string {
  if (html.includes('</head>')) {
    return html.replace('</head>', `${POPUP_BLOCK_SCRIPT}</head>`);
  }
  return POPUP_BLOCK_SCRIPT + html;
}

async function resolveM3u8(channelId: string): Promise<string | null> {
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

export function dlhdM3u8Plugin(): Plugin {
  return {
    name: 'dlhd-m3u8',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/dlhd/')) return next();

        const url = new URL(req.url, 'http://localhost');

        if (req.url.startsWith('/api/dlhd/embed-inner')) {
          const path = url.searchParams.get('path') || 'watch';
          const id = url.searchParams.get('id')?.replace(/\D/g, '');
          if (!id || !VALID_PATHS.has(path)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Bad request' }));
            return;
          }

          try {
            let embedUrl = await crawlInnerEmbedForPath(id, path, fetchHtml);
            if (!embedUrl) {
              embedUrl = getDirectPlayerUrl(id);
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (embedUrl) {
              res.end(JSON.stringify({ url: embedUrl }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No embeddable player for this path' }));
            }
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Embed resolve failed' }));
          }
          return;
        }

        if (req.url.startsWith('/api/dlhd/resolve')) {
          const path = url.searchParams.get('path') || 'watch';
          const id = url.searchParams.get('id')?.replace(/\D/g, '');
          if (!id || !VALID_PATHS.has(path)) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }

          const html = await fetchStreamPageHtml(path, id);
          if (!html) {
            res.statusCode = 502;
            res.end('Failed to load stream page');
            return;
          }

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(html);
          return;
        }

        if (req.url.startsWith('/api/dlhd/frame')) {
          const path = url.searchParams.get('path') || 'watch';
          const id = url.searchParams.get('id')?.replace(/\D/g, '');
          if (!id || !VALID_PATHS.has(path)) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }

          const html = await fetchStreamPageHtml(path, id);
          if (!html) {
            res.statusCode = 502;
            res.end('Failed to load stream page');
            return;
          }

          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(injectPopupBlock(html));
          return;
        }

        if (!req.url.startsWith('/api/dlhd/m3u8')) return next();

        const id = url.searchParams.get('id');
        if (!id) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing id' }));
          return;
        }

        try {
          const streamUrl = await resolveM3u8(id);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (streamUrl) {
            res.end(JSON.stringify({ url: streamUrl }));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No stream found' }));
          }
        } catch {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Resolve failed' }));
        }
      });
    },
  };
}
