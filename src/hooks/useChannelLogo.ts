import { useState, useEffect } from 'react';
import { resolveChannelLogoUrl } from '@/lib/channelLogos';

export function useChannelLogo(name: string, existingLogo?: string): {
  logoUrl: string;
  loading: boolean;
} {
  const [logoUrl, setLogoUrl] = useState(existingLogo ?? '');
  const [loading, setLoading] = useState(!existingLogo);

  useEffect(() => {
    let cancelled = false;

    if (existingLogo?.startsWith('http')) {
      setLogoUrl(existingLogo);
      setLoading(false);
      return;
    }

    setLoading(true);
    void resolveChannelLogoUrl(name, existingLogo).then(url => {
      if (cancelled) return;
      setLogoUrl(url || existingLogo || '');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [name, existingLogo]);

  return { logoUrl, loading };
}
