import { Capacitor } from '@capacitor/core';
import { withAutoplay } from '@/lib/dlhdStreamResolver';
import { getDlhdWrapperUrl } from '@/lib/dlhdPlayerUrls';

/**
 * Resolve iframe src for live playback.
 * Always returns a path-specific URL — never pre-scrapes to a shared daddy3 player.
 * - Web dev: same-origin frame proxy loads path-specific mirror HTML.
 * - Native / production web: path-specific DLHD mirror page in WebView.
 */
export function resolveLiveIframeSrc(
  channelId: string,
  path: string,
): Promise<string> {
  const id = channelId.replace(/\D/g, '') || channelId;
  const isNative = Capacitor.isNativePlatform();

  if (import.meta.env.DEV && !isNative) {
    return Promise.resolve(
      `/api/dlhd/frame?path=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`,
    );
  }

  return Promise.resolve(withAutoplay(getDlhdWrapperUrl(path, id)));
}
