/**
 * Both Web (Vite / Vercel) and Native Android (MainActivity BridgeWebViewClient)
 * serve /api/m3u, /api/m3u-probe, and /api/m3u-stream on same-origin.
 */
export function getApiBaseUrl(): string {
  return '';
}

export function useLiveApiProxy(): boolean {
  return true;
}


