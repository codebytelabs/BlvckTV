import { DLHD_BASE, HTML_HEADERS, type VercelReq, type VercelRes, q } from '../_lib/dlhdCore.js';

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const key = process.env.VITE_DLHD_API_KEY ?? process.env.DLHD_API_KEY ?? '';
  const endpoint = q(req, 'endpoint', 'channels');

  try {
    if (!key) {
      const page = await fetch(`${DLHD_BASE}/24-7-channels.php`, { headers: HTML_HEADERS });
      const text = await page.text();
      res.setHeader('Content-Type', page.headers.get('content-type') ?? 'text/html');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      res.status(page.status).send(text);
      return;
    }

    const url = `${DLHD_BASE}/daddyapi.php?endpoint=${encodeURIComponent(endpoint)}&key=${encodeURIComponent(key)}`;
    const upstream = await fetch(url, { headers: HTML_HEADERS });
    const text = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(upstream.status).send(text);
  } catch {
    res.status(502).json({ error: 'Upstream channels fetch failed' });
  }
}
