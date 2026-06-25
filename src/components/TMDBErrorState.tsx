import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface TMDBErrorStateProps {
  message: string;
  onRetry: () => void;
}

const SETUP_STEPS = [
  'Create a free account at themoviedb.org',
  'Open Settings → API and request an API key (Developer type)',
  'Copy the API Key (v3 auth) into your .env file as VITE_TMDB_API_KEY',
  'Restart the dev server for changes to take effect',
];

export default function TMDBErrorState({ message, onRetry }: TMDBErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="text-[#ef4444] mb-4" size={48} />
      <h2 className="text-lg font-bold text-[#f1f1f4] mb-2">Couldn&apos;t load content</h2>
      <p className="text-sm text-[#9ca3af] mb-6 max-w-md">{message}</p>

      <div className="w-full max-w-md mb-6 p-4 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.15)] text-left">
        <p className="text-xs font-semibold text-[#f1f1f4] mb-3">TMDB setup</p>
        <ol className="space-y-2 mb-4">
          {SETUP_STEPS.map((step, i) => (
            <li key={step} className="flex gap-2 text-xs text-[#9ca3af]">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] font-bold flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#06b6d4] hover:text-[#8b5cf6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] rounded"
        >
          Get your API key
          <ExternalLink size={12} />
        </a>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8b5cf6] text-white text-sm font-semibold hover:bg-[#7c3aed] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
      >
        <RefreshCw size={16} />
        Try Again
      </button>
    </div>
  );
}
