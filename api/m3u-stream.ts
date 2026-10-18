import { q, type VercelReq, type VercelRes } from './_lib/dlhdCore.js';

function rewriteHlsManifest(manifestText: string, baseUrl: string): string {
  return manifestText
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          try {
            const abs = new URL(uri, baseUrl).href;
            return `URI="/api/m3u-stream?url=${encodeURIComponent(abs)}"`;
          } catch {
            return _match;
          }
        });
      }
      try {
        const abs = new URL(trimmed, baseUrl).href;
        return `/api/m3u-stream?url=${encodeURIComponent(abs)}`;
      } catch {
        return line;
      }
    })
    .join('\n');
}

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const target = q(req, 'url');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (!target.startsWith('http')) {
    res.status(400).send('Invalid stream URL');
    return;
  }

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'IPTVSmartersPro',
        Accept: '*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok || upstream.status >= 400 || upstream.status === 884) {
      res.status(upstream.status >= 400 ? upstream.status : 502).send('Stream unavailable');
      return;
    }

    const finalUrl = upstream.url || target;
    const contentType = (upstream.headers.get('content-type') ?? '').toLowerCase();
    const isSegment = finalUrl.includes('.ts') && !finalUrl.includes('.m3u8');

    if (!isSegment && (contentType.includes('mpegurl') || target.includes('.m3u8'))) {
      const text = await upstream.text();
      if (text.trimStart().startsWith('#EXTM3U')) {
        const rewritten = rewriteHlsManifest(text, finalUrl);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.status(200).send(rewritten);
        return;
      }
    }

    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'video/mp2t');
    res.status(upstream.status).send(Buffer.from(arrayBuffer));
  } catch {
    res.status(502).send('Stream proxy error');
  }
}
