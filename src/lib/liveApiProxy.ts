import { isNativeApp } from '@/lib/nativePlatform';

export const REMOTE_API_ORIGIN = 'https://blvcktv-hum5mngfo-codebytelabs-projects.vercel.app';

/** Returns '' on Web (same-origin) or the deployed Vercel origin on Native Android. */
export function getApiBaseUrl(): string {
  return isNativeApp() ? REMOTE_API_ORIGIN : '';
}

/** Both Web and Native Android can use the fast /api proxy via Chromium's native network stack. */
export function useLiveApiProxy(): boolean {
  return true;
}

