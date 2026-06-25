# BlvckTV

Personal streaming hub — movies, TV shows, live channels, and sports in one dark-themed app. Works as a **web app**, **PWA-style static build**, and **Android APK** (phones, tablets, and Android TV).

## Features

- TMDB catalog with filters, search, watchlist, and history
- Live TV with direct HLS (no ads) + DLHD server fallbacks
- Sports schedule with one-tap channel playback
- Mobile-first UI with bottom navigation, filter sheets, and touch-friendly controls
- Android TV leanback launcher support

## Web (development)

```bash
cp .env.example .env
# Add VITE_TMDB_API_KEY from https://www.themoviedb.org/settings/api

yarn install
yarn dev
# → http://localhost:3000
```

## Web (production build)

```bash
yarn build
yarn preview
```

## Android APK (personal use)

Requires **Android SDK**, **JDK 21+**, and `ANDROID_HOME` set.

```bash
# 1. Build web assets and sync to Android
yarn build:android

# 2. Build debug APK (install on phone / tablet / TV via adb or file transfer)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
yarn android:apk
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`  
Also copied to: `releases/BlvckTV-1.0.2-debug.apk` (local, not in git)

Regenerate launcher icons from the webapp logo (`public/logo.png`):

```bash
./scripts/generate-android-icons.sh
```

Open in Android Studio (optional):

```bash
yarn android:open
```

### Install on device

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

On Android TV: sideload with adb, Send Files to TV, or a USB drive.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_TMDB_API_KEY` | Yes | TMDB API key (embedded at build time for APK) |
| `VITE_DLHD_API_KEY` | No | DLHD protected API; without it, channels load via HTML scrape |

## Stack

- React 19 + Vite 7 + TypeScript + Tailwind
- Capacitor 8 (Android mobile + TV)
- TMDB, DLHD live streams, VidSrc/Vidking embeds for VOD

## License

Personal use. Stream sources are third-party; use responsibly.
