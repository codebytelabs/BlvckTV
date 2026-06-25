import { isBlockedUrl, isAllowedStreamHost } from '@/lib/adBlock';

type GuardCleanup = () => void;

let installed = false;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Block popups, ad redirects, and focus-stealing navigation at the app shell level. */
export function installStreamGuard(): GuardCleanup {
  if (installed || typeof window === 'undefined') return () => undefined;
  installed = true;

  const originalOpen = window.open.bind(window);

  window.open = (...args: Parameters<typeof window.open>) => {
    const target = typeof args[0] === 'string' ? args[0] : args[0]?.toString() ?? '';
    if (!document.querySelector('[data-player-open="true"]')) {
      return originalOpen(...args);
    }
    console.warn('[BlvckTV] Blocked popup:', target || '(empty)');
    return null;
  };

  // Block target=_blank hijacks from embed fallbacks
  const onAuxClick = (e: MouseEvent) => {
    const anchor = (e.target as Element | null)?.closest?.('a[target="_blank"]') as HTMLAnchorElement | null;
    if (anchor && document.querySelector('[data-player-open="true"]')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (document.querySelector('[data-player-open="true"]')) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  const onClickCapture = (e: MouseEvent) => {
    const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href') ?? '';
    if (!href || href.startsWith('#') || href.startsWith('/')) return;

    try {
      const absolute = new URL(href, window.location.href).href;
      if (isBlockedUrl(absolute)) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('[BlvckTV] Blocked ad link:', absolute);
      }
    } catch {
      // ignore malformed URLs
    }
  };

  const onBlur = () => {
    const active = document.activeElement;
    if (active?.tagName === 'IFRAME') return;
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') return;
    const player = document.querySelector('[data-player-open="true"]') as HTMLElement | null;
    if (player) {
      player.focus({ preventScroll: true });
    }
  };

  window.addEventListener('beforeunload', onBeforeUnload);
  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('auxclick', onAuxClick, true);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.open = originalOpen;
    window.removeEventListener('beforeunload', onBeforeUnload);
    document.removeEventListener('click', onClickCapture, true);
    document.removeEventListener('auxclick', onAuxClick, true);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    installed = false;
  };
}

export function isSafeNavigationUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('#')) return true;

  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin === window.location.origin) return true;
    if (isAllowedStreamHost(url)) return true;
    if (isBlockedUrl(url)) return false;
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isStreamEmbedPageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\/embed\//.test(path) || /daddy\d*\.php/i.test(path) || /\/strm\//i.test(path);
  } catch {
    return false;
  }
}

export function streamRefererFor(url: string): string {
  const host = hostname(url);
  if (host.includes('embed.st')) return 'https://embed.st/';
  if (host.includes('dlhd.pk')) return 'https://dlhd.pk/';
  return 'https://dlhd.pk/';
}
