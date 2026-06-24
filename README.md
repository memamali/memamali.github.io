# أوتاد — Theatre Registration & Live Seating

Mobile-first, Arabic (RTL) web app for the one-night performance **أوتاد** at مأتم الإمام علي (ع), قرية بوري.

One public URL serves two modes (switched by the admin):

- **Registration** — a Google-Forms-style form to count expected attendance.
- **Live** — a real-time seat-availability board, while a door volunteer decrements the current show's seats from `/admin`.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Firebase (Firestore + Auth) with offline persistence. Deploy target: **GitHub Pages** (static export) or Vercel.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Public. Renders the form (registration mode) or the seat board (live mode) based on `config.mode`. |
| `/admin` | Firebase-Auth protected. Tabs: الردود (responses + CSV), العروض (shows setup), التحكم بالباب (door −1 control), وضع الموقع (mode + registration toggles). |

---

## Local development (with the Firebase Emulator Suite)

No real Firebase project needed — `.env.local` already points at a local emulator (project `demo-awtad`).

```bash
# 1. Install the Firebase CLI once (if you don't have it):
npm i -g firebase-tools        # or use: npx firebase-tools <cmd>

# 2. Start the emulators (Firestore :8080, Auth :9099, UI :4000):
npx firebase emulators:start

# 3. In another terminal, run the app:
npm run dev
```

Then:

1. Open the Emulator UI at <http://localhost:4000> → **Authentication** → **Add user** (email + password). This is your admin login.
2. Open <http://localhost:3000/admin>, sign in, and click **تهيئة الآن** to seed `config/main` + 3 shows (×165).
3. Use **وضع الموقع** to switch between registration and live; **التحكم بالباب** for the −1 control. Open `/` in another tab to see the public view update live.

> Emulator data is in-memory and resets on stop. Add `--export-on-exit ./.emu --import ./.emu` to persist between runs.

---

## Connecting a real Firebase project (production)

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Firestore Database** → create database (production mode).
3. **Build → Authentication** → enable **Email/Password**, then **Users → Add user** for each admin (accounts are created manually here — there is no public signup).
4. **Project settings → General → Your apps → Web app** → copy the config values into `.env.local` (see `.env.example`) and set `NEXT_PUBLIC_USE_EMULATOR=0`.
5. Deploy the security rules:
   ```bash
   firebase use --add          # select your real project (updates .firebaserc)
   firebase deploy --only firestore:rules
   ```
6. Run `npm run dev`, open `/admin`, sign in, and click **تهيئة الآن** to seed config + shows.

---

## Deploy to GitHub Pages (free static hosting)

The app is a **static site** (`output: "export"` in `next.config.ts`) — it runs entirely in the browser and talks to Firebase directly, so GitHub Pages can host it. The workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and deploys automatically on every push to `main`.

**One-time setup:**

1. Create a Firebase project (see "Connecting a real Firebase project" above) and note the web config.
2. Create a GitHub repo and push this project to it.
3. **Repo → Settings → Pages → Build and deployment → Source → "GitHub Actions".**
4. **Repo → Settings → Secrets and variables → Actions → New repository secret** — add these six (from your Firebase web config):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

   > These Firebase web values aren't truly secret (they ship to the browser by design); secrets just keep them out of the committed source. Real protection comes from `firestore.rules` + Auth.
5. **Firebase Console → Authentication → Settings → Authorized domains** → add your Pages domain (e.g. `your-username.github.io`).
6. Deploy the Firestore rules once: `firebase use --add` then `firebase deploy --only firestore:rules`.
7. Push to `main` (or run the workflow from the Actions tab). The site publishes at `https://<user>.github.io/<repo>/`.

Then open `https://<user>.github.io/<repo>/admin/`, sign in, and click **تهيئة الآن** to seed config + shows.

> The base path (`/<repo>`) is detected automatically by the workflow. A custom domain or a `<user>.github.io` user-site repo resolves to `/` with no changes needed.

**Build the static site locally** (optional sanity check):

```bash
npm run build    # outputs ./out  (index.html + admin/index.html + assets)
npx serve out    # preview it
```

(For day-to-day work use `npm run dev` with the emulator, not the static build.)

---

## Alternative: Deploy to Vercel

Import the repo in Vercel, add the six `NEXT_PUBLIC_FIREBASE_*` env vars + `NEXT_PUBLIC_USE_EMULATOR=0`, deploy, and add the Vercel domain to Firebase Auth authorized domains.

---

## Editing the form fields

All form fields live in [`src/lib/formConfig.ts`](src/lib/formConfig.ts). Add/remove/reorder a field there and it propagates to the public form, the admin responses table, and the CSV export. No other changes needed.

The seed page content (event name, description, post-submit message, default shows) lives in [`src/lib/defaults.ts`](src/lib/defaults.ts). Design tokens are in [`src/app/globals.css`](src/app/globals.css); see `DESIGN.md`.

---

## Data model (Firestore)

- `config/main` — `eventName, logoUrl, description, postSubmitMessage, mode, registrationOpen, currentShowId`.
- `shows/{id}` — `name, order, capacity, seatsRemaining`.
- `responses/{id}` — `createdAt` + the form field values.

Seat decrement/increment uses a Firestore **transaction** (floors at 0, caps at capacity, race-safe) when online, and falls back to a queued atomic `increment` when offline.
