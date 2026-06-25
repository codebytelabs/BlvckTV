import type { Plugin } from 'vite';

const PLAYER_SOURCES = [
  (id: string) => `https://hamis.romponalis.st/premiumtv/daddy3.php?id=${id}`,
  (id: string) => `https://dlhd.pk/player/stream-${id}.php`,
  (id: string) => `https://dlhd.pk/watch/stream-${id}.php`,
];

const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const ATOB_RE = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/;
const M3U8_RE = /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/;

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
        if (!req.url?.startsWith('/api/dlhd/m3u8')) return next();

        const url = new URL(req.url, 'http://localhost');
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
