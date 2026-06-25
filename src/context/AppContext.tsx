import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PageType, WatchItem, HistoryItem, ContinueWatchingItem, SelectedVideo } from '@/types';
import { getWatchlist, addToWatchlist as addWL, removeFromWatchlist as removeWL, isInWatchlist as checkWL, getHistory, addToHistory as addH, getContinueWatching, updateContinueWatching as updateCW, getSettings, saveSettings, removeContinueWatching as removeCW, type AppSettings } from '@/lib/storage';

interface AppState {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  selectedVideo: SelectedVideo | null;
  setSelectedVideo: (v: SelectedVideo | null) => void;
  selectedDetail: { id: number; type: 'movie' | 'tv' } | null;
  setSelectedDetail: (v: AppState['selectedDetail']) => void;
  selectedChannel: { id: string; name: string; logo: string; streamUrl?: string } | null;
  setSelectedChannel: (v: AppState['selectedChannel']) => void;
  watchlist: WatchItem[];
  refreshWatchlist: () => void;
  toggleWatchlist: (item: WatchItem) => void;
  isWatchlisted: (id: number, type: 'movie' | 'tv') => boolean;
  history: HistoryItem[];
  refreshHistory: () => void;
  addHistory: (item: HistoryItem) => void;
  continueWatching: ContinueWatchingItem[];
  refreshContinueWatching: () => void;
  updateContinue: (item: ContinueWatchingItem) => void;
  removeContinue: (id: number, type: 'movie' | 'tv') => void;
  settings: AppSettings;
  saveAppSettings: (s: AppSettings) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<AppState['selectedVideo']>(null);
  const [selectedDetail, setSelectedDetail] = useState<AppState['selectedDetail']>(null);
  const [selectedChannel, setSelectedChannel] = useState<AppState['selectedChannel']>(null);
  const [watchlist, setWatchlist] = useState<WatchItem[]>(getWatchlist());
  const [history, setHistory] = useState<HistoryItem[]>(getHistory());
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(getContinueWatching());
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toast, setToast] = useState<AppState['toast']>(null);

  const refreshWatchlist = useCallback(() => setWatchlist(getWatchlist()), []);
  const refreshHistory = useCallback(() => setHistory(getHistory()), []);
  const refreshContinueWatching = useCallback(() => setContinueWatching(getContinueWatching()), []);

  const toggleWatchlist = useCallback((item: WatchItem) => {
    if (checkWL(item.id, item.type)) {
      removeWL(item.id, item.type);
    } else {
      addWL(item);
    }
    refreshWatchlist();
  }, [refreshWatchlist]);

  const isWatchlisted = useCallback((id: number, type: 'movie' | 'tv') => checkWL(id, type), []);

  const addHistory = useCallback((item: HistoryItem) => {
    addH(item);
    refreshHistory();
  }, [refreshHistory]);

  const updateContinue = useCallback((item: ContinueWatchingItem) => {
    updateCW(item);
    refreshContinueWatching();
  }, [refreshContinueWatching]);

  const removeContinue = useCallback((id: number, type: 'movie' | 'tv') => {
    removeCW(id, type);
    refreshContinueWatching();
  }, [refreshContinueWatching]);

  const saveAppSettings = useCallback((s: AppSettings) => {
    saveSettings(s);
    setSettings(s);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage,
      sidebarCollapsed, setSidebarCollapsed,
      selectedVideo, setSelectedVideo,
      selectedDetail, setSelectedDetail,
      selectedChannel, setSelectedChannel,
      watchlist, refreshWatchlist, toggleWatchlist, isWatchlisted,
      history, refreshHistory, addHistory,
      continueWatching, refreshContinueWatching, updateContinue, removeContinue,
      settings, saveAppSettings,
      searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
