import { resolveM3u8FromDlhd } from '@/lib/dlhdM3u8Client';

const CACHE = new Map<string, { url: string; expiresAt: number }>();

export async function resolveM3u8Url(channelId: string): Promise<string | null> {
  const id = channelId.replace(/\D/g, '') || channelId;
  const cached = CACHE.get(id);
  if (cached && Date.now() < cached.expiresAt) return cached.url;

  try {
    let streamUrl: string | null = null;

    if (import.meta.env.DEV) {
      const res = await fetch(`/api/dlhd/m3u8?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        streamUrl = data.url ?? null;
      }
    } else {
      streamUrl = await resolveM3u8FromDlhd(id);
    }

    if (!streamUrl) return null;

    CACHE.set(id, { url: streamUrl, expiresAt: Date.now() + 5 * 60 * 1000 });
    return streamUrl;
  } catch {
    return null;
  }
}

export function clearM3u8Cache(): void {
  CACHE.clear();
}
