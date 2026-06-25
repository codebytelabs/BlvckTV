import { useApp } from '@/context/AppContext';
import { SOURCES } from '@/lib/streamingSources';
import type { StreamingSource } from '@/types';
import { Settings, CheckCircle2, XCircle, ChevronUp, ChevronDown, Key, Radio } from 'lucide-react';

const PLACEHOLDER_KEY = 'your_tmdb_api_key_here';

function getTmdbKeyStatus(): 'configured' | 'missing' | 'placeholder' {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) return 'missing';
  if (key === PLACEHOLDER_KEY) return 'placeholder';
  return 'configured';
}

function getDlhdKeyStatus(): 'configured' | 'missing' {
  const key = import.meta.env.VITE_DLHD_API_KEY;
  return key ? 'configured' : 'missing';
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
  const dlhdStatus = getDlhdKeyStatus();
  const priority = settings.sourcePriority ?? SOURCES.map(s => s.id);

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

  return (
    <div className="space-y-8 pb-10 page-fade-in">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-[#8b5cf6]" />
        <h1 className="text-2xl font-extrabold text-[#f1f1f4]">Settings</h1>
      </div>

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

        <div className="p-4 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.15)] space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Radio size={18} className="text-[#06b6d4] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#f1f1f4]">DLHD API Key</p>
                <p className="text-xs text-[#6b7280] mt-1">
                  Optional. Enables faster Live TV channel loading via the DLHD API instead of HTML scraping. Set <code className="text-[#9ca3af]">VITE_DLHD_API_KEY</code> in <code className="text-[#9ca3af]">.env</code>.
                </p>
              </div>
            </div>
            <StatusBadge status={dlhdStatus === 'configured' ? 'configured' : 'missing'} />
          </div>
          {dlhdStatus === 'missing' && (
            <p className="text-xs text-[#9ca3af]">
              Without a key, channels load from the public DLHD page or fallback list.
            </p>
          )}
        </div>
      </section>

      {/* Source Priority */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#6b7280]">Streaming Sources</h2>
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
                    className="accent-[#8b5cf6] w-4 h-4 shrink-0"
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
    </div>
  );
}
