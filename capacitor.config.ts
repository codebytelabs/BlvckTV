import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codebytelabs.blvcktv',
  appName: 'BlvckTV',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0a0f',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
