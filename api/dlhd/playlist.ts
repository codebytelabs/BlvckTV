import {
  normalizeId,
  resolveM3u8,
  rewriteManifest,
  HLS_HEADERS,
  q,
  type VercelReq,
  type VercelRes,
} from '../_lib/dlhdCore.js';

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const id = normalizeId(q(req, 'id'));
  if (!id) {
    res.status(400).send('Bad request');
    return;
  }

  const streamUrl = await resolveM3u8(id);
  if (!streamUrl) {
    res.status(404).send('No stream found');
    return;
  }

  try {
    const upstream = await fetch(streamUrl, { headers: HLS_HEADERS });
    if (!upstream.ok) {
      res.status(502).send('Upstream playlist error');
      return;
    }
    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(rewriteManifest(text, streamUrl));
  } catch {
    res.status(502).send('Upstream fetch failed');
  }
}
