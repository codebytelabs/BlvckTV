import { Capacitor } from '@capacitor/core';
import { withAutoplay } from '@/lib/dlhdStreamResolver';
import { getDirectPlayerUrl } from '@/lib/dlhdPlayerUrls';

/**
 * Resolve iframe src for live playback.
 * - Web dev: same-origin frame proxy (never iframe dlhd.pk directly from localhost).
 * - Native APK: direct player URL (WebView allows it).
 * - Production web: frame proxy if deployed with API, else null → caller uses HLS.
 */
export async function resolveLiveIframeSrc(
  channelId: string,
  path: string,
): Promise<string | null> {
  const id = channelId.replace(/\D/g, '') || channelId;
  const isNative = Capacitor.isNativePlatform();

  if (import.meta.env.DEV && !isNative) {
    return `/api/dlhd/frame?path=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`;
  }

  if (isNative) {
    return withAutoplay(getDirectPlayerUrl(id));
  }

  return null;
}
