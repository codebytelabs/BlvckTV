import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

const DLHD_HEADERS = {
  Accept: 'application/json, text/html, */*',
  Referer: 'https://dlhd.pk/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const IPTV_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'IPTVSmartersPro',
};

function headersToRecord(url: string, headers?: RequestInit['headers']): Record<string, string> {
  const base = url.includes('dlhd.pk') ? DLHD_HEADERS : IPTV_HEADERS;
  if (!headers) return { ...base };
  if (headers instanceof Headers) {
    const out: Record<string, string> = { ...base };
    headers.forEach((value, key) => { out[key] = value; });
    return out;
  }
  if (Array.isArray(headers)) {
    return { ...base, ...Object.fromEntries(headers) };
  }
  return { ...base, ...headers };
}

/** Native HTTP bypasses WebView CORS; web uses timed fetch. */
export async function platformFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12_000,
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = headersToRecord(url, options.headers);

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url,
      method,
      headers,
      responseType: 'text',
    });

    const body = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data ?? '');

    return new Response(body, {
      status: response.status,
      headers: response.headers as HeadersInit,
    });
  }

  return fetchWithTimeout(url, { ...options, headers }, timeoutMs);
}

export async function platformFetchText(
  url: string,
  options: RequestInit = {},
): Promise<string | null> {
  try {
    const res = await platformFetch(url, options);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export async function platformFetchJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T | null> {
  try {
    const res = await platformFetch(url, options);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
