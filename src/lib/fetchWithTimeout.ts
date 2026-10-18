const DEFAULT_TIMEOUT_MS = 12_000;

export class FetchTimeoutError extends Error {
  constructor(url: string) {
    super(`Request timed out: ${url}`);
    this.name = 'FetchTimeoutError';
  }
}

/** fetch with AbortController timeout — prevents WebView hangs on dead connections. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new FetchTimeoutError(url);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
