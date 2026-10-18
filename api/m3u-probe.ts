import { q, type VercelReq, type VercelRes } from './_lib/dlhdCore.js';

/** Lightweight stream & Xtream account probe. */
export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  const target = q(req, 'url');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!target.startsWith('http')) {
    res.status(400).json({ ok: false, error: 'Bad url' });
    return;
  }

  try {
    const parsedTarget = new URL(target);
    const isXtream =
      parsedTarget.pathname.includes('get.php') ||
      parsedTarget.pathname.includes('player_api.php');

    if (isXtream) {
      const user = parsedTarget.searchParams.get('username') ?? '';
      const pass = parsedTarget.searchParams.get('password') ?? '';
      const apiUrl = `${parsedTarget.protocol}//${parsedTarget.host}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
      const upstream = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'IPTVSmartersPro',
          Accept: 'application/json, */*',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(6500),
      });

      if (!upstream.ok) {
        res.status(200).json({ ok: false, status: upstream.status, reason: `HTTP ${upstream.status}` });
        return;
      }

      const data = (await upstream.json()) as {
        user_info?: {
          auth?: number | string;
          status?: string;
          active_cons?: number | string;
          max_connections?: number | string;
        };
      };
      const ui = data?.user_info;
      if (ui && Number(ui.auth) === 1 && ui.status === 'Active') {
        const activeCons = Number(ui.active_cons ?? 0);
        const maxCons = Number(ui.max_connections ?? 1);
        const hasSlot = maxCons === 0 || activeCons < maxCons;
        res.status(200).json({
          ok: hasSlot,
          status: 200,
          accountStatus: ui.status,
          activeCons,
          maxCons,
          reason: hasSlot ? 'Online' : `Max connections in use (${activeCons}/${maxCons})`,
        });
        return;
      }

      res.status(200).json({
        ok: false,
        status: 401,
        accountStatus: ui?.status ?? 'Invalid',
        reason: ui?.status ? `Account ${ui.status}` : 'Invalid credentials',
      });
      return;
    }

    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'IPTVSmartersPro',
        Accept: '*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6500),
    });

    if (!upstream.ok || upstream.status >= 400 || upstream.status === 884) {
      res.status(200).json({ ok: false, status: upstream.status });
      return;
    }

    const reader = upstream.body?.getReader();
    if (reader) {
      const chunk = await reader.read();
      await reader.cancel();
      const hasData = Boolean(chunk?.value && chunk.value.length > 0);
      res.status(200).json({ ok: hasData, status: upstream.status });
      return;
    }

    res.status(200).json({ ok: true, status: upstream.status });
  } catch {
    res.status(200).json({ ok: false, status: 0 });
  }
}
