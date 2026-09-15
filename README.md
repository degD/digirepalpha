Digital repertoire manager built with Next.js, CodeMirror, and browser-local storage.

## Development

Install dependencies with Bun, then start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
# Unit tests
bun test

# Linting
bun run lint

# Install the Playwright engines used by this project once
bunx playwright install chromium webkit

# End-to-end tests, against the static production bundle on port 3001
bun run test:e2e
```

The Playwright suite runs independently in desktop Chromium and WebKit. It covers search, song creation and deletion, editor persistence, chord controls, long-press word selection, song detail editing, routing states, and complete database import/export workflows.

## Android

The Android application is a Capacitor 8 wrapper around the static Next.js export. It supports Android 7 (API 24) and newer.

Requirements:

- Node.js 22 or newer
- Android Studio 2025.2.1 or newer
- Android SDK platform API 24 or newer
- An Android device or emulator

```bash
# Build the static web bundle and copy it into the Android project
bun run android:sync

# Choose a connected device or emulator and install a debug build
bun run android:run

# Open the native project in Android Studio
bun run android:open

# Build a debug APK at android/app/build/outputs/apk/debug/
bun run android:apk
```

The Android application ID is `net.dege.digirep`; keep it stable so upgrades retain local data. Android export opens the system share sheet with a `db.songs` backup. Import uses the Android document picker.

## Storage

Songs are stored in the browser or app's local storage. Web and Android installations have separate local databases. Use the Data page to export a `db.songs` backup or replace the local database from a backup.
