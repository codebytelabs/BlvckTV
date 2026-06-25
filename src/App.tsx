import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { useStreamGuard } from '@/hooks/useStreamGuard';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import VideoPlayer from '@/components/VideoPlayer';
import LiveTVPlayer from '@/components/LiveTVPlayer';
import DetailModal from '@/components/DetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MoviesPage = lazy(() => import('@/pages/MoviesPage'));
const TVShowsPage = lazy(() => import('@/pages/TVShowsPage'));
const LiveTVPage = lazy(() => import('@/pages/LiveTVPage'));
const SportsPage = lazy(() => import('@/pages/SportsPage'));
const WatchlistPage = lazy(() => import('@/pages/WatchlistPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageContent() {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage />;
      case 'movies': return <MoviesPage />;
      case 'tvshows': return <TVShowsPage />;
      case 'livetv': return <LiveTVPage />;
      case 'sports': return <SportsPage />;
      case 'watchlist': return <WatchlistPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<PageSkeleton />}>
          {renderPage()}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton rounded-[24px]" style={{ height: 450 }} />
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton rounded-[10px] shrink-0" style={{ width: 180, height: 270 }} />
        ))}
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-lg glass-modal border-l-3"
      style={{ borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#8b5cf6' }}
    >
      <span className="text-sm text-[#f1f1f4]">{toast.message}</span>
    </motion.div>
  );
}

function AppInner() {
  const { selectedVideo, selectedChannel, selectedDetail } = useApp();
  useStreamGuard();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <div className="mx-auto w-full" style={{ maxWidth: 1600 }}>
            <PageContent />
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Overlays */}
      <AnimatePresence>
        {selectedVideo && <VideoPlayer />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedChannel && <LiveTVPlayer />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedDetail && <DetailModal />}
      </AnimatePresence>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
