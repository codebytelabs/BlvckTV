import {
  VALID_PATHS,
  normalizeId,
  fetchStreamPageHtml,
  q,
  type VercelReq,
  type VercelRes,
} from '../_lib/dlhdCore.js';

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const path = q(req, 'path', 'watch');
  const id = normalizeId(q(req, 'id'));
  if (!id || !VALID_PATHS.has(path)) {
    res.status(400).send('Bad request');
    return;
  }

  const html = await fetchStreamPageHtml(path, id);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(html);
}
