import { HLS_HEADERS, rewriteManifest, q, type VercelReq, type VercelRes } from '../_lib/dlhdCore.js';

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const target = q(req, 'url');
  if (!target.startsWith('http')) {
    res.status(400).send('Bad request');
    return;
  }

  try {
    const upstream = await fetch(target, { headers: HLS_HEADERS });
    if (!upstream.ok) {
      res.status(502).end();
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await upstream.arrayBuffer());
    const isPlaylist =
      target.includes('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');

    if (isPlaylist) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.status(200).send(rewriteManifest(buffer.toString('utf8'), target));
      return;
    }

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.status(200).send(buffer);
  } catch {
    res.status(502).end();
  }
}
