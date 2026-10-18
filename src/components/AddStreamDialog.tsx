import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import {
  addCustomPlaylist,
  buildXtreamUrl,
  type PlaylistType,
} from '@/lib/customPlaylists';
import { Radio, Plus } from 'lucide-react';

type AddStreamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (playlistId: string) => void;
};

export default function AddStreamDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddStreamDialogProps) {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<PlaylistType>('m3u');
  const [url, setUrl] = useState('');

  // Xtream specific inputs
  const [xtreamMode, setXtreamMode] = useState<'url' | 'credentials'>('url');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [outputFormat, setOutputFormat] = useState<'ts' | 'm3u8'>('ts');

  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setType('m3u');
    setUrl('');
    setXtreamMode('url');
    setServerUrl('');
    setUsername('');
    setPassword('');
    setOutputFormat('ts');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a stream name', 'error');
      return;
    }

    let finalUrl = url.trim();

    if (type === 'xstream') {
      if (xtreamMode === 'credentials') {
        if (!serverUrl.trim() || !username.trim() || !password.trim()) {
          showToast('Server URL, username, and password are required', 'error');
          return;
        }
        finalUrl = buildXtreamUrl(serverUrl, username, password, outputFormat);
      } else {
        if (!finalUrl) {
          showToast('Please enter the Xtream get.php URL', 'error');
          return;
        }
      }
    } else {
      if (!finalUrl) {
        showToast('Please enter the M3U playlist URL', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const created = addCustomPlaylist({
        name: name.trim(),
        type,
        url: finalUrl,
        serverUrl: xtreamMode === 'credentials' ? serverUrl.trim() : undefined,
        username: xtreamMode === 'credentials' ? username.trim() : undefined,
        password: xtreamMode === 'credentials' ? password.trim() : undefined,
        outputFormat: type === 'xstream' ? outputFormat : undefined,
        enabled: true,
      });

      showToast(`Stream "${created.name}" added successfully!`, 'success');
      resetForm();
      onOpenChange(false);
      onSuccess?.(created.id);
    } catch {
      showToast('Failed to add stream', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#14141f] border border-[rgba(139,92,246,0.25)] text-[#f1f1f4] p-6 shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#8b5cf6]">
              <Radio size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#f1f1f4]">Add Stream / Playlist</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">
                Add your own M3U playlist or Xtream Codes server
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Stream Type Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0a0a0f] rounded-xl border border-[rgba(139,92,246,0.15)]">
            <button
              type="button"
              onClick={() => setType('m3u')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'm3u'
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-md'
                  : 'text-[#9ca3af] hover:text-[#f1f1f4]'
              }`}
            >
              M3U Playlist
            </button>
            <button
              type="button"
              onClick={() => setType('xstream')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'xstream'
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-md'
                  : 'text-[#9ca3af] hover:text-[#f1f1f4]'
              }`}
            >
              Xtream Codes
            </button>
          </div>

          {/* Stream Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9ca3af]">Stream Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Sports M3U or Home Xtream"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-sm text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
            />
          </div>

          {/* M3U Form */}
          {type === 'm3u' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9ca3af]">Playlist URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-sm text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
              />
              <p className="text-[11px] text-[#6b7280]">
                Supports direct .m3u, .m3u8 URLs, or GitHub repo links (auto-converts).
              </p>
            </div>
          )}

          {/* Xtream Form */}
          {type === 'xstream' && (
            <div className="space-y-3">
              <div className="flex gap-4 text-xs font-semibold text-[#9ca3af]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="xtreamMode"
                    checked={xtreamMode === 'url'}
                    onChange={() => setXtreamMode('url')}
                    className="accent-[#8b5cf6]"
                  />
                  <span>Full get.php URL</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="xtreamMode"
                    checked={xtreamMode === 'credentials'}
                    onChange={() => setXtreamMode('credentials')}
                    className="accent-[#8b5cf6]"
                  />
                  <span>Server Credentials</span>
                </label>
              </div>

              {xtreamMode === 'url' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9ca3af]">Xtream Playlist URL</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://server.xyz/get.php?username=...&password=...&type=m3u_plus&output=ts"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-xs text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#9ca3af]">Server / Host</label>
                    <input
                      type="text"
                      required
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="http://example.com:8080"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-sm text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#9ca3af]">Username</label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-sm text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#9ca3af]">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-sm text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#9ca3af]">Stream Output Format</label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as 'ts' | 'm3u8')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-sm text-[#f1f1f4] outline-none focus:border-[#8b5cf6]"
                    >
                      <option value="ts">MPEG-TS (.ts) - Default</option>
                      <option value="m3u8">HLS (.m3u8) - Recommended for web</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-xl border border-[rgba(139,92,246,0.2)] text-xs font-semibold text-[#9ca3af] hover:text-[#f1f1f4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-xs font-bold text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus size={14} />
              {submitting ? 'Adding…' : 'Add Stream'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
