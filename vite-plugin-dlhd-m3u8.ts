import type { Plugin } from 'vite';
import { crawlInnerEmbedForPath } from './src/lib/dlhdInnerEmbed';
import {
  getDirectPlayerUrl,
  getDlhdWrapperUrl,
} from './src/lib/dlhdPlayerUrls';

const PLAYER_SOURCES = [
  (id: string) => getDirectPlayerUrl(id),
  ...(['watch', 'player', 'plus', 'casting', 'cast', 'stream'] as const).map(
    (path) => (id: string) => getDlhdWrapperUrl(path, id),
  ),
];

const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const ATOB_RE = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/;
const M3U8_RE = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/;

const VALID_PATHS = new Set(['watch', 'player', 'plus', 'casting', 'cast', 'stream']);

const POPUP_BLOCK_SCRIPT = `<script>(function(){var o=window.open;window.open=function(){return null};})();</script>`;

const HLS_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  Referer: 'https://dlhd.pk/',
  Accept: '*/*',
};

function rewriteManifest(body: string, baseUrl: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1)}`;
  return body
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const absolute = trimmed.startsWith('http') ? trimmed : new URL(trimmed, base).href;
      return `/api/dlhd/segment?url=${encodeURIComponent(absolute)}`;
    })
    .join('\n');
}

async function fetchStreamResource(targetUrl: string): Promise<Response | null> {
  try {
    return await fetch(targetUrl, { headers: HLS_FETCH_HEADERS });
  } catch {
    return null;
  }
}

async function serveProxiedPlaylist(channelId: string, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: string) => void }): Promise<void> {
  const streamUrl = await resolveM3u8(channelId);
  if (!streamUrl) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('No stream found');
    return;
  }

  const upstream = await fetchStreamResource(streamUrl);
  if (!upstream?.ok) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Upstream playlist error');
    return;
  }

  const text = await upstream.text();
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.end(rewriteManifest(text, streamUrl));
}

async function serveProxiedSegment(targetUrl: string, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: Buffer | string) => void }): Promise<void> {
  const upstream = await fetchStreamResource(targetUrl);
  if (!upstream?.ok) {
    res.statusCode = 502;
    res.end();
    return;
  }

  const contentType = upstream.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await upstream.arrayBuffer());
  const isPlaylist =
    targetUrl.includes('.m3u8') ||
    contentType.includes('mpegurl') ||
    contentType.includes('m3u8');

  res.statusCode = 200;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (isPlaylist) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.end(rewriteManifest(buffer.toString('utf8'), targetUrl));
    return;
  }

  res.setHeader('Content-Type', contentType || 'application/octet-stream');
  res.end(buffer);
}

function isPlayablePlayerHtml(html: string): boolean {
  return (
    /<iframe[^>]+src=["']https?:\/\//i.test(html) ||
    /new Clappr\.Player/i.test(html) ||
    /Hls\.isSupported/i.test(html)
  );
}

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

function buildEmbedFramePage(embedUrl: string): string {
  const safeSrc = embedUrl.replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live</title>
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
${POPUP_BLOCK_SCRIPT}
</head><body>
<iframe src="${safeSrc}" allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *" referrerpolicy="no-referrer"></iframe>
</body></html>`;
}

function injectFreshM3u8IntoClappr(html: string, playlistPath: string): string {
  const encoded = Buffer.from(playlistPath).toString('base64');
  if (/atob\s*\(\s*['"][^'"]+['"]\s*\)/.test(html)) {
    return html.replace(/atob\s*\(\s*['"][^'"]+['"]\s*\)/, `atob('${encoded}')`);
  }
  return html;
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
    var playlistUrl = '/api/dlhd/playlist?id=${id}';
    var v = document.getElementById('v');
    if (window.Hls && Hls.isSupported()) {
      var hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hls.loadSource(playlistUrl);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, function(){ v.play().catch(function(){}); });
      hls.on(Hls.Events.ERROR, function(ev, d){
        if (d.fatal) document.body.innerHTML='<p style="color:#aaa;text-align:center;padding:2rem">Stream unavailable</p>';
      });
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = playlistUrl;
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

async function fetchSharedPlayerFallback(id: string): Promise<string> {
  const playlistPath = `/api/dlhd/playlist?id=${encodeURIComponent(id)}`;
  const playerHtml = await fetchHtml(getDirectPlayerUrl(id));
  if (playerHtml && /Clappr\.Player/i.test(playerHtml)) {
    return injectFreshM3u8IntoClappr(playerHtml, playlistPath);
  }
  if (playerHtml && isPlayablePlayerHtml(playerHtml)) {
    return playerHtml;
  }
  return buildHlsFramePlayer(id);
}

/**
 * Path-first stream page resolution:
 * 1. Path-specific DLHD wrapper HTML when available
 * 2. Path-specific wrapper iframe (browser loads mirror even if Node fetch failed)
 * 3. Path-specific inner embed when crawl finds a unique player for this mirror
 * 4. Shared HLS fallback only when dlhd.pk is unreachable (same stream, but playback works)
 */
async function fetchStreamPageHtml(path: string, id: string): Promise<string> {
  const wrapperUrl = getDlhdWrapperUrl(path, id);
  const wrapperHtml = await fetchHtml(wrapperUrl);

  if (wrapperHtml && isPlayablePlayerHtml(wrapperHtml)) {
    return wrapperHtml;
  }

  if (wrapperHtml !== null) {
    return buildEmbedFramePage(wrapperUrl);
  }

  const innerUrl = await crawlInnerEmbedForPath(id, path, fetchHtml);
  if (innerUrl) {
    return buildEmbedFramePage(innerUrl);
  }

  return fetchSharedPlayerFallback(id);
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

        if (req.url.startsWith('/api/dlhd/playlist')) {
          const id = url.searchParams.get('id')?.replace(/\D/g, '');
          if (!id) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          await serveProxiedPlaylist(id, res);
          return;
        }

        if (req.url.startsWith('/api/dlhd/segment')) {
          const target = url.searchParams.get('url');
          if (!target?.startsWith('http')) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
          }
          await serveProxiedSegment(target, res);
          return;
        }

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
            const embedUrl = await crawlInnerEmbedForPath(id, path, fetchHtml);
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
