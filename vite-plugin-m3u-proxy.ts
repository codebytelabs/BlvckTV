import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { Plugin } from 'vite';

function rewriteHlsManifest(manifestText: string, baseUrl: string): string {
  return manifestText
    .split(/\r?\n/)
    .map((line) => {
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

export function m3uProxyPlugin(): Plugin {
  return {
    name: 'm3u-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? '';
        if (!rawUrl.startsWith('/api/m3u')) return next();

        try {
          const requestUrl = new URL(rawUrl, 'http://localhost');
          const pathname = requestUrl.pathname;
          const target = requestUrl.searchParams.get('url');

          if (pathname === '/api/m3u-probe') {
            if (!target?.startsWith('http')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: false, error: 'Bad url' }));
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
                  signal: AbortSignal.timeout(6000),
                });

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');

                if (!upstream.ok) {
                  res.end(JSON.stringify({ ok: false, status: upstream.status, reason: `HTTP ${upstream.status}` }));
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
                  res.end(
                    JSON.stringify({
                      ok: hasSlot,
                      status: 200,
                      accountStatus: ui.status,
                      activeCons,
                      maxCons,
                      reason: hasSlot ? 'Online' : `Max connections in use (${activeCons}/${maxCons})`,
                    }),
                  );
                  return;
                }

                res.end(
                  JSON.stringify({
                    ok: false,
                    status: 401,
                    accountStatus: ui?.status ?? 'Invalid',
                    reason: ui?.status ? `Account ${ui.status}` : 'Invalid credentials',
                  }),
                );
                return;
              }

              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 6000);
              const upstream = await fetch(target, {
                method: 'GET',
                headers: {
                  'User-Agent': 'IPTVSmartersPro',
                  Accept: '*/*',
                },
                redirect: 'follow',
                signal: controller.signal,
              });
              clearTimeout(timeout);

              if (!upstream.ok || upstream.status >= 400 || upstream.status === 884) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ ok: false, status: upstream.status }));
                return;
              }

              const reader = upstream.body?.getReader();
              if (reader) {
                const chunk = await reader.read();
                await reader.cancel();
                const hasData = Boolean(chunk?.value && chunk.value.length > 0);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ ok: hasData, status: upstream.status }));
                return;
              }

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: true, status: upstream.status }));
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: false, status: 0 }));
            }
            return;
          }

          if (pathname === '/api/m3u-stream') {
            if (!target?.startsWith('http')) {
              res.statusCode = 400;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end('Invalid stream URL');
              return;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            let upstream: Response;
            try {
              upstream = await fetch(target, {
                method: 'GET',
                headers: {
                  'User-Agent': 'IPTVSmartersPro',
                  Accept: '*/*',
                },
                redirect: 'follow',
                signal: controller.signal,
              });
            } finally {
              clearTimeout(timeout);
            }

            if (!upstream.ok || upstream.status >= 400 || upstream.status === 884) {
              res.statusCode = upstream.status >= 400 ? upstream.status : 502;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end('Stream unavailable');
              return;
            }

            const finalUrl = upstream.url || target;
            const contentType = (upstream.headers.get('content-type') ?? '').toLowerCase();
            const isSegment = finalUrl.includes('.ts') && !finalUrl.includes('.m3u8');

            if (!isSegment && (contentType.includes('mpegurl') || target.includes('.m3u8'))) {
              const text = await upstream.text();
              if (text.trimStart().startsWith('#EXTM3U')) {
                const rewritten = rewriteHlsManifest(text, finalUrl);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Cache-Control', 'no-store');
                res.end(rewritten);
                return;
              }
            }

            res.statusCode = upstream.status;
            res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'video/mp2t');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store');
            if (upstream.body) {
              const nodeStream = Readable.fromWeb(upstream.body as unknown as WebReadableStream);
              nodeStream.on('error', () => {
                if (!res.writableEnded) res.end();
              });
              req.on('close', () => {
                nodeStream.destroy();
              });
              nodeStream.pipe(res);
            } else {
              res.end();
            }
            return;
          }

          if (pathname !== '/api/m3u') return next();

          if (!target) {
            res.statusCode = 400;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end('Missing url parameter');
            return;
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 25000);
          try {
            const upstream = await fetch(target, {
              headers: {
                Accept: '*/*',
                'User-Agent': 'IPTVSmartersPro',
              },
              redirect: 'follow',
              signal: controller.signal,
            });

            res.statusCode = upstream.status;
            res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-store');
            res.end(await upstream.text());
          } finally {
            clearTimeout(timeout);
          }
        } catch {
          res.statusCode = 502;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end('Upstream fetch failed');
        }
      });
    },
  };
}
