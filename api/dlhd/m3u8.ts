import { normalizeId, resolveM3u8, q, type VercelReq, type VercelRes } from '../_lib/dlhdCore.js';

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const id = normalizeId(q(req, 'id'));
  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }

  try {
    const streamUrl = await resolveM3u8(id);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    if (streamUrl) {
      res.status(200).json({ url: streamUrl });
    } else {
      res.status(404).json({ error: 'No stream found' });
    }
  } catch {
    res.status(500).json({ error: 'Resolve failed' });
  }
}
