import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels } from '@/hooks/useChannels';
import { resolveLiveChannel } from '@/lib/liveChannelResolver';
import type { Channel } from '@/types';

type WatchChannelInput = Pick<Channel, 'id' | 'name' | 'logo'> & {
  streamUrl?: string;
};

/** Same channel resolution path Sports uses — always attach catalog streamUrl + normalized id. */
export function useWatchChannel() {
  const { setSelectedChannel } = useApp();
  const { channels } = useChannels();

  return useCallback(
    (input: WatchChannelInput) => {
      setSelectedChannel(resolveLiveChannel(input, channels));
    },
    [setSelectedChannel, channels],
  );
}
