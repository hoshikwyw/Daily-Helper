# Kayv — Web (Vercel) + Mobile (Capacitor)

One codebase ships two ways:

- **Web** — Next.js **static export** (`output: 'export'`), hosted on Vercel.
- **Mobile** — the same `out/` static bundle wrapped by Capacitor into native Android/iOS apps.

The app is a pure client-side SPA (no server runtime): auth is gated client-side
([components/auth-guard.tsx](components/auth-guard.tsx)) and all data comes from Supabase
over the network with Row Level Security.

---

## 1. Deploy the web version on Vercel

The static export deploys on Vercel with **no extra config** — the Next.js preset
detects `output: 'export'` and serves the generated `out/` folder.

1. Import the repo at vercel.com → **New Project**.
2. Framework preset: **Next.js** (auto). Build command `next build`, output is handled automatically.
3. Add **Environment Variables** (they're inlined at build time, so they must be set on Vercel —
   `.env` is gitignored):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Every push to `main` redeploys.

### Supabase redirect allow-list (required for login email links)
**Supabase → Authentication → URL Configuration → Redirect URLs** — add:

- `https://<your-vercel-domain>/auth/callback` (production web)
- `http://localhost:5173/auth/callback` (local dev)
- `kayv://auth/callback` (native apps — see below)

The web callback uses `window.location.origin`, so it works on any domain automatically.

---

## 2. Build & install on your Android device

Building the native app needs the **Android SDK** (this repo only contains the project;
the SDK is a one-time machine install). Java 21 is already required and present.

### Option A — Android Studio (easiest)
1. Install **Android Studio** (bundles the SDK + platform tools).
2. On your phone: **Settings → Developer options → USB debugging = ON**, plug in via USB,
   accept the "Allow debugging" prompt.
3. From the repo: `npm run mobile:android` (builds the web bundle, syncs, opens Android Studio).
4. Pick your device in the toolbar and press **Run** ▶. The app installs and launches.

### Option B — command line (no IDE)
After the SDK is installed and `ANDROID_HOME` is set (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`):

```bash
# build a debug APK
npm run android:apk
# -> android/app/build/outputs/apk/debug/app-debug.apk

# OR build + install straight to a connected device
npm run android:install
```

To sideload the APK manually, copy `app-debug.apk` to the phone and open it
(enable "Install unknown apps" for your file manager), or `adb install app-debug.apk`.

> After changing any web code, re-run `npm run mobile:android` / `android:apk` so the
> updated `out/` is copied into the native project.

---

## 3. iOS

The `ios/` Xcode project exists, but building/running requires **macOS + Xcode**.
On a Mac: `npm run mobile:ios`.

---

## 4. Sharing expense images (Android → Google Drive, etc.)

The "⬇ Save image" buttons on the Expenses page:

- **Web** → download the PNG.
- **Native** → write the PNG to the app cache and open the system **share sheet**
  (`@capacitor/share`), so you can send it to **Google Drive**, WhatsApp, Photos, etc.

This works out of the box: the app's `FileProvider` + `<cache-path>` in
[android/app/src/main/res/xml/file_paths.xml](android/app/src/main/res/xml/file_paths.xml)
let other apps read the shared file. (Drive must be installed to appear in the sheet.)
