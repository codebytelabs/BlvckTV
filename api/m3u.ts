import { q, type VercelReq, type VercelRes } from './_lib/dlhdCore.js';

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const target = q(req, 'url');
  if (!target) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const parsed = new URL(target);
    if (!parsed.protocol.startsWith('http')) {
      res.status(400).send('Invalid protocol');
      return;
    }

    const upstream = await fetch(target, {
      headers: {
        Accept: '*/*',
        'User-Agent': 'IPTVSmartersPro',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(22000),
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(body);
  } catch {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).send('Upstream fetch failed');
  }
}
