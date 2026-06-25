import { resolveM3u8FromDlhd } from '@/lib/dlhdM3u8Client';

/** m3u8 signed URLs rotate every fetch — do not cache across playback sessions. */
export async function resolveM3u8Url(channelId: string): Promise<string | null> {
  const id = channelId.replace(/\D/g, '') || channelId;

  try {
    if (import.meta.env.DEV) {
      try {
        const res = await fetch(`/api/dlhd/m3u8?id=${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as { url?: string };
          if (data.url) return data.url;
        }
      } catch {
        // fall through
      }
    }

    return await resolveM3u8FromDlhd(id);
  } catch {
    return null;
  }
}

export function clearM3u8Cache(): void {
  // no-op — caching disabled for signed URLs
}
