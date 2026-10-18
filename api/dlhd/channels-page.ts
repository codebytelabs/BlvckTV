import { DLHD_BASE, HTML_HEADERS, type VercelReq, type VercelRes } from '../_lib/dlhdCore.js';

export default async function handler(_req: VercelReq, res: VercelRes): Promise<void> {
  try {
    const upstream = await fetch(`${DLHD_BASE}/24-7-channels.php`, { headers: HTML_HEADERS });
    const text = await upstream.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(text);
  } catch {
    res.status(502).send('Upstream fetch failed');
  }
}
