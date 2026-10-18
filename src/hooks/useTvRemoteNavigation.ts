import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"]',
  '[tabindex="0"]',
].join(', ');

function isVisible(el: HTMLElement): boolean {
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 4 && rect.height > 4;
}

function getActiveScopeRoot(): ParentNode {
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"], [data-player-open="true"], .glass-modal'),
  ).filter(isVisible);
  if (dialogs.length > 0) {
    return dialogs[dialogs.length - 1];
  }
  return document;
}

function getFocusableElements(): HTMLElement[] {
  const root = getActiveScopeRoot();
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

type Direction = 'up' | 'down' | 'left' | 'right';

function findNextFocusable(current: HTMLElement, dir: Direction, candidates: HTMLElement[]): HTMLElement | null {
  const curRect = current.getBoundingClientRect();
  const curCx = curRect.left + curRect.width / 2;
  const curCy = curRect.top + curRect.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const el of candidates) {
    if (el === current || current.contains(el) || el.contains(current)) continue;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = cx - curCx;
    const dy = cy - curCy;

    if (dir === 'right' && dx <= 6) continue;
    if (dir === 'left' && dx >= -6) continue;
    if (dir === 'down' && dy <= 6) continue;
    if (dir === 'up' && dy >= -6) continue;

    const primaryDist = dir === 'left' || dir === 'right' ? Math.abs(dx) : Math.abs(dy);
    const crossDist = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);

    // Check overlap along perpendicular axis (same row for left/right, same column for up/down)
    const overlapsAxis =
      dir === 'left' || dir === 'right'
        ? rect.bottom > curRect.top - 12 && rect.top < curRect.bottom + 12
        : rect.right > curRect.left - 12 && rect.left < curRect.right + 12;

    // Heavily favor items in the same row/column
    const crossWeight = overlapsAxis ? 1.5 : 4.2;
    const score = primaryDist + crossDist * crossWeight;

    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

/**
 * Spatial 2D D-Pad / TV Remote navigation hook for Android TV & Smart TV browsers.
 */
export function useTvRemoteNavigation(): void {
  const {
    selectedVideo,
    setSelectedVideo,
    selectedChannel,
    setSelectedChannel,
    selectedDetail,
    setSelectedDetail,
  } = useApp();

  useEffect(() => {
    const handleTvBack = (e: Event) => {
      if (selectedVideo) {
        e.preventDefault();
        setSelectedVideo(null);
        return;
      }
      if (selectedChannel) {
        e.preventDefault();
        setSelectedChannel(null);
        return;
      }
      if (selectedDetail) {
        e.preventDefault();
        setSelectedDetail(null);
        return;
      }
      const firstNav = document.querySelector<HTMLElement>('aside button, nav button');
      if (firstNav && document.activeElement !== firstNav) {
        e.preventDefault();
        firstNav.focus();
      }
    };

    window.addEventListener('blvcktv:tv-back', handleTvBack);
    return () => window.removeEventListener('blvcktv:tv-back', handleTvBack);
  }, [
    selectedVideo,
    setSelectedVideo,
    selectedChannel,
    setSelectedChannel,
    selectedDetail,
    setSelectedDetail,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isTextInput =
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
        (active as HTMLInputElement).type !== 'range' &&
        (active as HTMLInputElement).type !== 'checkbox' &&
        (active as HTMLInputElement).type !== 'button';

      // Channel Up / Down on TV remotes
      if (e.key === 'ChannelUp' || e.key === 'PageUp') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('blvcktv:channel-step', { detail: -1 }));
        return;
      }
      if (e.key === 'ChannelDown' || e.key === 'PageDown') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('blvcktv:channel-step', { detail: 1 }));
        return;
      }

      // Media Play/Pause button on TV remote
      if (e.key === 'MediaPlayPause' || e.key === 'MediaPlay' || e.key === 'MediaPause') {
        const video = document.querySelector('video');
        if (video) {
          e.preventDefault();
          if (video.paused) void video.play().catch(() => {});
          else video.pause();
          return;
        }
      }

      // Escape / Backspace (when not typing in an input)
      if (e.key === 'Escape' || (e.key === 'Backspace' && !isTextInput)) {
        if (selectedVideo) {
          e.preventDefault();
          setSelectedVideo(null);
          return;
        }
        if (selectedChannel) {
          e.preventDefault();
          setSelectedChannel(null);
          return;
        }
        if (selectedDetail) {
          e.preventDefault();
          setSelectedDetail(null);
          return;
        }
      }

      // Enter / DPAD_CENTER on role="button" elements
      if (e.key === 'Enter' && active && active.getAttribute('role') === 'button') {
        e.preventDefault();
        active.click();
        return;
      }

      const dirMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const dir = dirMap[e.key];
      if (!dir) return;

      // Allow native cursor movement inside non-empty text input for Left/Right
      if (isTextInput && (dir === 'left' || dir === 'right')) {
        const input = active as HTMLInputElement;
        const val = input.value || '';
        if (val.length > 0) return;
      }

      // Allow native select dropdown handling when opened with Up/Down only if Alt/Meta held
      if (active?.tagName === 'SELECT' && (dir === 'up' || dir === 'down')) {
        return;
      }

      const candidates = getFocusableElements();
      if (candidates.length === 0) return;

      if (!active || active === document.body || !candidates.includes(active)) {
        e.preventDefault();
        const first =
          candidates.find(el => el.closest('main')) ??
          candidates[0];
        first?.focus();
        first?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        return;
      }

      const next = findNextFocusable(active, dir, candidates);
      if (next) {
        e.preventDefault();
        next.focus();
        next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    selectedVideo,
    setSelectedVideo,
    selectedChannel,
    setSelectedChannel,
    selectedDetail,
    setSelectedDetail,
  ]);
}
