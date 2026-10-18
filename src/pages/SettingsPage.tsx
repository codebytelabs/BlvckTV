import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { SOURCES } from '@/lib/streamingSources';
import type { StreamingSource } from '@/types';
import {
  getStoredPlaylists,
  saveStoredPlaylists,
  deleteCustomPlaylist,
  resetToDefaultPlaylists,
  getStreamHealthMap,
  type CustomPlaylist,
  type StreamHealthStatus,
} from '@/lib/customPlaylists';
import { clearM3uCache, probePlaylistHealth } from '@/lib/m3uApi';
import AddStreamDialog from '@/components/AddStreamDialog';
import {
  Settings,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Key,
  Radio,
  Plus,
  Trash2,
  RotateCcw,
  Database,
  RefreshCw,
} from 'lucide-react';

const PLACEHOLDER_KEY = 'your_tmdb_api_key_here';

function getTmdbKeyStatus(): 'configured' | 'missing' | 'placeholder' {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) return 'missing';
  if (key === PLACEHOLDER_KEY) return 'placeholder';
  return 'configured';
}

function StatusBadge({ status }: { status: 'configured' | 'missing' | 'placeholder' }) {
  if (status === 'configured') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10b981] text-xs font-semibold">
        <CheckCircle2 size={12} /> Configured
      </span>
    );
  }
  if (status === 'placeholder') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.15)] text-[#f59e0b] text-xs font-semibold">
        <XCircle size={12} /> Placeholder value
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.15)] text-[#ef4444] text-xs font-semibold">
      <XCircle size={12} /> Not set
    </span>
  );
}

export default function SettingsPage() {
  const { settings, saveAppSettings, showToast } = useApp();
  const tmdbStatus = getTmdbKeyStatus();
  const priority = settings.sourcePriority ?? SOURCES.map(s => s.id);

  const [playlists, setPlaylists] = useState<CustomPlaylist[]>(getStoredPlaylists);
  const [healthMap, setHealthMap] = useState<Record<string, StreamHealthStatus>>(getStreamHealthMap);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setPlaylists(getStoredPlaylists());
    };
    const handleHealthSync = () => {
      setHealthMap(getStreamHealthMap());
    };
    window.addEventListener('blvcktv_playlists_changed', handleSync);
    window.addEventListener('blvcktv_stream_health_changed', handleHealthSync);
    return () => {
      window.removeEventListener('blvcktv_playlists_changed', handleSync);
      window.removeEventListener('blvcktv_stream_health_changed', handleHealthSync);
    };
  }, []);

  const handleTestStream = async (playlist: CustomPlaylist) => {
    setTestingId(playlist.id);
    try {
      const res = await probePlaylistHealth(playlist);
      setHealthMap(getStreamHealthMap());
      if (res.status === 'online') {
        showToast(`${playlist.name} is Online 🟢`, 'success');
      } else {
        showToast(`${playlist.name} is Offline 🔴 (${res.reason ?? 'Unreachable'})`, 'error');
      }
    } finally {
      setTestingId(null);
    }
  };

  const toggleSource = (id: StreamingSource) => {
    const next = priority.includes(id)
      ? priority.filter(s => s !== id)
      : [...priority, id];
    if (next.length === 0) {
      showToast('At least one streaming source must stay enabled', 'error');
      return;
    }
    saveAppSettings({ ...settings, sourcePriority: next });
  };

  const moveSource = (id: StreamingSource, direction: 'up' | 'down') => {
    const idx = priority.indexOf(id);
    if (idx === -1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= priority.length) return;
    const next = [...priority];
    [next[idx], next[target]] = [next[target], next[idx]];
    saveAppSettings({ ...settings, sourcePriority: next });
  };

  const orderedSources = [
    ...priority.map(id => SOURCES.find(s => s.id === id)).filter(Boolean),
    ...SOURCES.filter(s => !priority.includes(s.id)),
  ] as typeof SOURCES;

  const togglePlaylist = (id: string) => {
    const updated = playlists.map(p => {
      if (p.id === id) {
        return { ...p, enabled: !p.enabled };
      }
      return p;
    });

    const hasEnabled = updated.some(p => p.enabled);
    if (!hasEnabled) {
      showToast('At least one Live TV stream must remain enabled', 'error');
      return;
    }

    setPlaylists(updated);
    saveStoredPlaylists(updated);
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    if (playlists.length <= 1) {
      showToast('You must keep at least one stream playlist', 'error');
      return;
    }
    deleteCustomPlaylist(id);
    setPlaylists(getStoredPlaylists());
    showToast(`Stream "${name}" removed`, 'success');
  };

  const handleResetPlaylists = () => {
    const defaults = resetToDefaultPlaylists();
    setPlaylists(defaults);
    showToast('Restored default M3U & Xtream streams', 'success');
  };

  const handleClearCache = () => {
    clearM3uCache();
    showToast('Live TV channel cache cleared', 'success');
  };

  return (
    <div className="space-y-8 pb-12 page-fade-in">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-[#8b5cf6]" />
        <h1 className="text-2xl font-extrabold text-[#f1f1f4]">Settings</h1>
      </div>

      {/* Live TV Streams & Custom Playlists Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-[#8b5cf6]" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#f1f1f4]">
                Live TV Streams & Playlists
              </h2>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">
              Add or remove custom M3U playlists and Xtream Codes servers. Manage default streams.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPlaylists}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.2)] hover:border-[#8b5cf6] text-[#9ca3af] hover:text-[#f1f1f4] text-xs font-semibold transition-colors"
              title="Restore default M3U and Xtream lists"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
            >
              <Plus size={14} />
              <span>Add Stream</span>
            </button>
          </div>
        </div>

        {/* Playlists List */}
        <div className="space-y-2.5">
          {playlists.map((playlist) => {
            const status = healthMap[playlist.id] ?? 'online';
            const isOnline = status === 'online';
            return (
              <div
                key={playlist.id}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                  !playlist.enabled
                    ? 'bg-[#0a0a0f] border-[rgba(139,92,246,0.08)] opacity-50'
                    : isOnline
                      ? 'bg-[#14141f] border-[rgba(139,92,246,0.18)] hover:border-[rgba(139,92,246,0.35)]'
                      : 'bg-[#11111a] border-[rgba(239,68,68,0.18)] opacity-75'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={playlist.enabled}
                    onChange={() => togglePlaylist(playlist.id)}
                    aria-label={`Enable ${playlist.name}`}
                    className="accent-[#8b5cf6] w-4 h-4 shrink-0 rounded cursor-pointer"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isOnline ? 'text-[#f1f1f4]' : 'text-[#9ca3af]'}`}>
                        {playlist.name}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isOnline
                            ? 'bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.3)] text-[#22c55e]'
                            : 'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)] text-[#ef4444]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                          playlist.type === 'xstream'
                            ? 'bg-[rgba(139,92,246,0.2)] text-[#a78bfa] border border-[rgba(139,92,246,0.3)]'
                            : 'bg-[rgba(6,182,212,0.18)] text-[#22d3ee] border border-[rgba(6,182,212,0.3)]'
                        }`}
                      >
                        {playlist.type}
                      </span>
                      {playlist.isDefault && (
                        <span className="text-[9px] text-[#6b7280] font-medium hidden sm:inline">
                          (Default)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280] truncate max-w-lg mt-0.5">
                      {playlist.url}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleTestStream(playlist)}
                    disabled={testingId === playlist.id}
                    className="p-2 rounded-lg text-[#9ca3af] hover:text-[#8b5cf6] hover:bg-[rgba(139,92,246,0.15)] transition-colors"
                    title="Test stream connection"
                    aria-label={`Test ${playlist.name}`}
                  >
                    <RefreshCw size={14} className={testingId === playlist.id ? 'animate-spin text-[#8b5cf6]' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                    className="p-2 rounded-lg text-[#ef4444]/70 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
                    title="Remove this stream playlist"
                    aria-label={`Remove ${playlist.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cache Management Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.12)] text-xs text-[#9ca3af]">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-[#8b5cf6]" />
            <span>Channels are cached locally for fast, instantaneous page loads.</span>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            className="text-xs font-semibold text-[#8b5cf6] hover:text-[#06b6d4] transition-colors"
          >
            Clear Channel Cache
          </button>
        </div>
      </section>

      {/* API Keys */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#6b7280]">API Keys</h2>

        <div className="p-4 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.15)] space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Key size={18} className="text-[#8b5cf6] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#f1f1f4]">TMDB API Key</p>
                <p className="text-xs text-[#6b7280] mt-1">
                  Required for movies, TV shows, and search. Set <code className="text-[#9ca3af]">VITE_TMDB_API_KEY</code> in <code className="text-[#9ca3af]">.env</code>.
                </p>
              </div>
            </div>
            <StatusBadge status={tmdbStatus} />
          </div>
          {tmdbStatus !== 'configured' && (
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-semibold text-[#06b6d4] hover:text-[#8b5cf6] transition-colors"
            >
              Get a free key at themoviedb.org →
            </a>
          )}
        </div>
      </section>

      {/* Source Priority (VOD / Movies / TV) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#6b7280]">Movie & TV Streaming Sources</h2>
          <p className="text-xs text-[#6b7280] mt-1">Toggle sources and reorder priority. First enabled source is used by default.</p>
        </div>

        <div className="space-y-2">
          {orderedSources.map((source) => {
            const enabled = priority.includes(source.id);
            const priorityIndex = priority.indexOf(source.id);
            return (
              <div
                key={source.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  enabled
                    ? 'bg-[#14141f] border-[rgba(139,92,246,0.15)]'
                    : 'bg-[#0a0a0f] border-[rgba(139,92,246,0.08)] opacity-60'
                }`}
              >
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleSource(source.id)}
                    className="accent-[#8b5cf6] w-4 h-4 shrink-0 rounded"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f1f1f4]">
                      {source.name}
                      {enabled && priorityIndex >= 0 && (
                        <span className="ml-2 text-[10px] font-bold text-[#8b5cf6] uppercase">#{priorityIndex + 1}</span>
                      )}
                    </p>
                    <p className="text-xs text-[#6b7280] truncate">{source.description}</p>
                  </div>
                </label>
                {enabled && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSource(source.id, 'up')}
                      disabled={priorityIndex <= 0}
                      className="p-1 rounded text-[#6b7280] hover:text-[#f1f1f4] hover:bg-[#1e1e2d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={`Move ${source.name} up`}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSource(source.id, 'down')}
                      disabled={priorityIndex === priority.length - 1}
                      className="p-1 rounded text-[#6b7280] hover:text-[#f1f1f4] hover:bg-[#1e1e2d] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={`Move ${source.name} down`}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Stream In-Page Dialog Modal */}
      <AddStreamDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={() => {
          setPlaylists(getStoredPlaylists());
        }}
      />
    </div>
  );
}
