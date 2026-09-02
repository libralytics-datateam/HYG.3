# HYG.3 Mobile

A React Native / Expo implementation of the `/client` patient portal, built from the
`HYG3 Mobile App.dc.html` Claude Design prototype. Bottom tab nav (Home, Scan, Check-in,
Profile), 15 screens, English / ไทย / 中文 / 日本語.

## Running it

```
cd mobile
npm install
cp .env.example .env   # point EXPO_PUBLIC_API_URL at your running server/ (see root README)
npx expo start
```

Requires `server/` running (see the repo root `README.md`) — this app has no bundled
backend of its own, same as the web client. On a physical device or Android emulator,
`localhost` in `.env` won't reach your machine — use your LAN IP.

Camera capture (the hand-scan flow) needs a physical device or the Expo Go / dev-client
camera permission flow; it will not work in most simulators.

## What's real vs. what's local-only

Every screen is wired to the actual API (`server/routes/*`) wherever an endpoint exists:
onboarding, recommendations, check-ins, hand-scan analysis + camera, WHOOP status/sync/
disconnect, biometric trends, and pharmacist-review requests all hit the real server and
persist to the real database — nothing is mocked data.

A few things in the design ("new thinking" per `chats/chat1.md`) have no backing endpoint
in this codebase, so they're implemented honestly rather than faked:

- **Per-dose tracking, streaks, the supplement day-grid** — the API only stores one
  `adherence` value per check-in (`server/routes/checkins.ts`), not per-dose ticks. These
  are tracked locally on-device (`src/hooks/useDoseTracker.ts`, AsyncStorage-backed) layered
  on top of the real vitamins list from the latest recommendation. Streak is computed from
  real check-in history, not a fake counter.
- **Fitbit** — the server only implements WHOOP (`server/routes/wearables.ts`). The
  Profile screen's Fitbit tab is present (matching the design and the user's later request)
  but shows a "coming soon" note rather than a non-functional connect button. WHOOP is
  fully wired: connect (opens the OAuth URL in an in-app browser, since the server's OAuth
  callback redirects to the *web* app's callback route, not a native deep link — there's no
  `hyg3://` scheme on the server side to redirect to), sync, disconnect, status.
- **Pharmacist chat** — there is no messaging endpoint, only
  `POST /telemedicine/request-review`. The chat screen is a real request queue dressed as a
  thread: sent messages become review requests (with the message as `reason`), and this is
  disclosed in-thread rather than presented as live chat.
- **Notifications** — there's no notifications endpoint. The list is derived from real
  state already loaded (check-in due today, last WHOOP sync, latest reviewed scan) rather
  than a static mock list (`src/hooks/useNotifications.ts`).
- **Dose AM/PM badges** — the API doesn't return per-supplement timing, so it's inferred
  from the dosage/reason text (`inferSlot` in `HomeScreen.tsx`), defaulting to Morning.

## Structure

```
src/
  api/          fetch client + typed endpoint wrappers (mirrors src/lib/api.ts's model:
                no session auth, patientId carried explicitly — see wearables.ts's comment)
  context/      PatientContext — single source of truth for patient/recommendation/
                check-in/wearable state, loaded once and refreshed by each screen
  i18n/         reuses hyg.3/src/i18n/locales/*.json verbatim, plus a "mobile" namespace
                for phone-only copy (same 4 locales, key-parity checked)
  navigation/   Root (Onboarding vs Main) → Main tabs → Home tab's nested stack
  screens/      one folder per design screen/flow
  components/   shared primitives (Card, Button, Chip, TrendChart, ...)
  hooks/        useDoseTracker (local habit tracking), useNotifications (derived)
  theme/        tokens.ts mirrors project/_ds/.../tokens/colors.css + hyg.3/src/index.css
```

## Known gaps (not addressed here — flag before shipping)

- No app icons/splash assets beyond the Expo template placeholders in `assets/`.
- WHOOP connect relies on the user manually returning to the app after completing OAuth
  in the in-app browser — there's no automatic deep-link handoff (see above).
- Not run in a simulator/device as part of this change (sandboxed environment); verified
  with `npx tsc --noEmit` and an i18n key-parity check across all 4 locales, not by hand.
