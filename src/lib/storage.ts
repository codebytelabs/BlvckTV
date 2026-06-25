import type { WatchItem, HistoryItem, ContinueWatchingItem } from '@/types';
import { DEFAULT_SOURCE_PRIORITY } from '@/lib/streamingSources';

const KEYS = {
  WATCHLIST: 'blvcktv_watchlist',
  HISTORY: 'blvcktv_history',
  CONTINUE_WATCHING: 'blvcktv_continue',
  SETTINGS: 'blvcktv_settings',
};

const LEGACY_KEYS: Record<keyof typeof KEYS, string> = {
  WATCHLIST: 'streamhub_watchlist',
  HISTORY: 'streamhub_history',
  CONTINUE_WATCHING: 'streamhub_continue',
  SETTINGS: 'streamhub_settings',
};

function migrateLegacyStorage(): void {
  (Object.keys(KEYS) as (keyof typeof KEYS)[]).forEach(key => {
    const current = localStorage.getItem(KEYS[key]);
    const legacy = localStorage.getItem(LEGACY_KEYS[key]);
    if (!current && legacy) {
      localStorage.setItem(KEYS[key], legacy);
    }
  });
}

migrateLegacyStorage();

export function getWatchlist(): WatchItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.WATCHLIST) || '[]');
  } catch {
    return [];
  }
}

export function addToWatchlist(item: WatchItem): void {
  const list = getWatchlist();
  if (!list.find(i => i.id === item.id && i.type === item.type)) {
    list.unshift(item);
    localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(list));
  }
}

export function removeFromWatchlist(id: number, type: 'movie' | 'tv'): void {
  const list = getWatchlist().filter(i => !(i.id === id && i.type === type));
  localStorage.setItem(KEYS.WATCHLIST, JSON.stringify(list));
}

export function isInWatchlist(id: number, type: 'movie' | 'tv'): boolean {
  return getWatchlist().some(i => i.id === id && i.type === type);
}

export function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
}

export function addToHistory(item: HistoryItem): void {
  const list = getHistory();
  const existing = list.findIndex(i => i.id === item.id && i.type === item.type);
  if (existing !== -1) list.splice(existing, 1);
  list.unshift(item);
  if (list.length > 500) list.length = 500;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(list));
}

export function clearHistory(): void {
  localStorage.setItem(KEYS.HISTORY, '[]');
}

export function getContinueWatching(): ContinueWatchingItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CONTINUE_WATCHING) || '[]');
  } catch {
    return [];
  }
}

export function updateContinueWatching(item: ContinueWatchingItem): void {
  const list = getContinueWatching();
  const existing = list.findIndex(i => i.id === item.id && i.type === item.type);
  if (existing !== -1) {
    if (item.type === 'tv' && item.season && item.episode) {
      const existingTV = list[existing];
      if (existingTV.season === item.season && existingTV.episode === item.episode) {
        list[existing] = item;
      } else {
        list.splice(existing, 1);
        list.unshift(item);
      }
    } else {
      list[existing] = item;
    }
  } else {
    list.unshift(item);
  }
  if (list.length > 100) list.length = 100;
  localStorage.setItem(KEYS.CONTINUE_WATCHING, JSON.stringify(list));
}

export function removeContinueWatching(id: number, type: 'movie' | 'tv'): void {
  const list = getContinueWatching().filter(i => !(i.id === id && i.type === type));
  localStorage.setItem(KEYS.CONTINUE_WATCHING, JSON.stringify(list));
}

export interface AppSettings {
  autoPlay: boolean;
  defaultQuality: string;
  defaultSubtitleLang: string;
  enableOpenSubtitles: boolean;
  sourcePriority: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  autoPlay: true,
  defaultQuality: 'auto',
  defaultSubtitleLang: 'en',
  enableOpenSubtitles: false,
  sourcePriority: [...DEFAULT_SOURCE_PRIORITY],
};

/** Prior factory defaults — migrate stored settings that still use them. */
const LEGACY_DEFAULT_PRIORITIES = [
  [
    'vidsrcto',
    'vidsync',
    'vidking',
    'rivestream',
    'rivestreamAgg',
    'vidsrcme',
    'rivestreamTorrent',
  ],
  [
    'vidsrcme',
    'vidking',
    'vidsync',
    'vidsrcto',
    'rivestream',
    'rivestreamAgg',
    'rivestreamTorrent',
  ],
  [
    'vidsrcto',
    'vidsrcme',
    'vidking',
    'vidsync',
    'rivestream',
    'rivestreamAgg',
    'rivestreamTorrent',
  ],
];

function shouldMigrateSourcePriority(priority: string[] | undefined): boolean {
  if (!priority?.length) return true;
  const joined = priority.join(',');
  return LEGACY_DEFAULT_PRIORITIES.some(legacy => joined === legacy.join(','));
}

export function getSettings(): AppSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || 'null') as Partial<AppSettings> | null;
    if (!raw || !Object.keys(raw).length) return { ...DEFAULT_SETTINGS };

    const merged: AppSettings = { ...DEFAULT_SETTINGS, ...raw };
    if (shouldMigrateSourcePriority(raw.sourcePriority)) {
      merged.sourcePriority = [...DEFAULT_SOURCE_PRIORITY];
      saveSettings(merged);
    }
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}
