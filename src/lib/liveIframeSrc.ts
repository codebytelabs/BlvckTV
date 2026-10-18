import { Capacitor } from '@capacitor/core';
import { withAutoplay } from '@/lib/dlhdStreamResolver';
import { getDirectPlayerUrl, getDlhdWrapperUrl } from '@/lib/dlhdPlayerUrls';
import { useLiveApiProxy } from '@/lib/liveApiProxy';

/**
 * Resolve iframe src for live playback.
 * - Web (dev + Vercel): same-origin frame proxy.
 * - Native: direct daddy3 player (wrappers block Capacitor localhost parent).
 */
export async function resolveLiveIframeSrc(
  channelId: string,
  path: string,
): Promise<string> {
  const id = channelId.replace(/\D/g, '') || channelId;
  const isNative = Capacitor.isNativePlatform();

  if (useLiveApiProxy()) {
    return `/api/dlhd/frame?path=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`;
  }

  if (isNative) {
    // DLHD wrapper pages block Capacitor localhost parent ("Access Denied").
    return withAutoplay(getDirectPlayerUrl(id));
  }

  return withAutoplay(getDlhdWrapperUrl(path, id));
}
