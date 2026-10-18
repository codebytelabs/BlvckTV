import { useState, useEffect } from 'react';

export function useChannelLogo(_name: string, existingLogo?: string): {
  logoUrl: string;
  loading: boolean;
} {
  const [logoUrl, setLogoUrl] = useState(existingLogo ?? '');

  useEffect(() => {
    if (existingLogo?.startsWith('http') || existingLogo?.startsWith('data:')) {
      setLogoUrl(existingLogo);
    } else {
      setLogoUrl('');
    }
  }, [existingLogo]);

  return { logoUrl, loading: false };
}
