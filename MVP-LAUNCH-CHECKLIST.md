# HYG.3 — MVP Completion & Deployment Checklist

Snapshot date: 2026-08-22, last swept for accuracy 2026-08-27 (second pass same day: CI added, health check/meta-tags/demo-mode banner confirmed already live). Based on reading the current codebase (not the roadmap docs alone) — items reference actual files/lines so they're actionable.

**Deploy split (decided):** frontend (Vite/React) → Vercel. Backend (Express + Prisma/Postgres + Python ML subprocess + Gemini vision) stays on Render, as `render.yaml` already targets. Nothing here migrates the backend to Vercel serverless.

---

## 0. Repo hygiene (do this first — there is no git repo yet)

- [x] `git init` — done, initial commit `a6971ce` (311 files, working tree clean).
- [x] Fix root `.gitignore`: now excludes `.env`, `.env.*` (with `!.env.example` allowed through), `*.db`/`*.sqlite*`, and Python venv/cache dirs.
- [x] Add `data/.venv/` and Python cache/checkpoint dirs to `.gitignore` — verified via `git check-ignore` that `data/.venv` is excluded; the 4 real source files in `data/` (2 notebooks, 2 scripts) are tracked normally.
- [x] Confirmed `server/prisma/dev.db` is excluded (added `*.db` to `server/.gitignore`, which already had `.env`).
- [x] Added `.env.example` (root) and `server/.env.example` documenting required vars (`VITE_API_URL`; `DATABASE_URL`, `GEMINI_API_KEY`) now that real `.env` files are gitignored.
- [x] Pushed to GitHub (`libralytics-datateam/HYG.3`, private).
- [x] **Vercel project connected — resolved 2026-08-26/27.** Not the original `hyg3` project (ownership was never resolved — see §5's superseded note), but a fresh project (`hyg-3`, at `hyg-3.vercel.app`) created under the account holder's own login, GitHub App connected, auto-deploy on push confirmed working across many commits since.

---

## 1. Security & correctness gaps (fix before any real user touches this)

- [x] **Authentication/authorization built.** JWT-based login (`POST /v1/auth/login`, `GET /v1/auth/me`) with bcrypt-hashed passwords (`User.passwordHash`, new schema field), `requireAuth`/`requireRole` middleware (`server/middleware/auth.ts`), a login page + route guard on the frontend (`src/pages/Auth/Login.tsx`, `src/components/RequireAuth.tsx`, `src/context/AuthContext.tsx`). All admin/B2B routers (`ai`, `insights`, `patients`, `datasets`, `stats`, `products`) now require a valid token. **Also fixed a bigger bug found in the process:** every one of those routes was returning data across *all* orgs with zero filtering (`patient.findMany()`, `dataset.findMany()`, etc. had no `where` clause at all) — now every query is scoped to `req.user.orgId`. Verified end-to-end via curl (401 without token, org-scoped data with one) and in a real browser (login → dashboard → approve an insight → logout → `/app` bounces back to `/login`).
- [x] `server/routes/ai.ts` (`/v1/ai/predict`) no longer uses `findFirst()` guesses — it takes `orgId` from the authenticated session and requires a real `patientId` in the body, checked against that org.
- [x] `src/pages/App/AiInsightsDetail.tsx:54`'s `reviewerId: 'mock-reviewer-id'` is gone — the backend now derives `reviewedById` from the authenticated token only, never the client body. Verified in the DB after a live review action: `reviewedBy: sarah@libralytics.com`, not a mock value.
- [x] CORS locked to an allowlist via `CORS_ORIGIN` env var (comma-separated origins, defaults to `http://localhost:5173`) instead of wide-open `cors()` — `server/index.ts`. Set to `https://hyg-3.vercel.app` on the live Render service — done.
- [x] **Partially resolved — verified 2026-08-27.** `GEMINI_API_KEY` is still blank in production, so hand-scan "analysis" still falls back to `getSimulatedAnalysis()` — but this checklist item's second option ("surface a visible demo mode flag") was already built: the backend returns `analysisMode: 'simulated'|'gemini-vision'` (`server/routes/handscan.ts:87`, also surfaced at `GET /v1/health` as `geminiConfigured`), and `HandScanner.tsx:218-222` renders a visible warning banner (`t('handScanner.demoModeBanner')`, all 4 locales) whenever a scan result comes back simulated. Nobody can mistake a demo read for a real one in the UI. Setting a real key remains open below.
- [ ] `requireRole(...roles)` middleware exists but isn't applied anywhere yet — right now any authenticated org member can review/approve insights regardless of role (e.g. `Lead Clinician` vs `Pharmacist`). Roles are currently free-form strings from seed data, not the PRD's fixed enum (`org_admin`/`analyst`/`pharmacist`/`it_admin`) — worth deciding the real role set before gating specific actions by role.
- [ ] Local dev login: `sarah@libralytics.com` / `marcus@libralytics.com`, password `password123` (seeded via `server/prisma/seed.ts`) — demo-only, rotate before any real pilot data.
- [x] **PRD §13 compliance conflict — resolved 2026-08-27.** The PRD explicitly says the Vitamin Deficiency Prediction model must never be "wired into a user-facing output" and may only be used PROTOTYPE/internal, but `server/routes/ai.ts` (line 24 above) was doing exactly that. Investigated further and found the underlying data doesn't meet any medical-grade bar at all — see `data/DATA_PROVENANCE.md` for the full assessment (synthetic training data with a publicly-documented faulty-validation issue, plus an unvalidated invented heuristic in the runtime feature mapping). `POST /v1/ai/predict` now returns 503 unconditionally; the model/script files remain as research artifacts per PRD §13's PROTOTYPE allowance, just unreachable from any live route. No frontend code called this endpoint, so nothing user-visible broke.

---

## 2. Static pages that need real wiring (or should be cut from MVP)

- [x] `src/pages/App/Team.tsx` — cut from nav/routing entirely (2026-08-27), per this item's own recommendation. File left in place, unreachable.
- [x] `src/pages/App/Organization.tsx` — cut from nav/routing entirely (2026-08-27), same call.
- [x] `src/pages/Marketing/Contact.tsx` — wired to a real `POST /v1/contact` endpoint with loading/success/error states (2026-08-27). Submissions are server-logged, not yet persisted to a table (DB role lacks `CREATE` — see `data/DATA_PROVENANCE.md`).
- [x] `src/pages/App/Models.tsx` — was fully static/fabricated (fake F1/precision/recall). Rebuilt (2026-08-27) around `GET /v1/stats/data-readiness`, showing real accumulated data-collection counts instead.

---

## 3. Core MVP flows — finish and test end-to-end

- [ ] Walk Onboarding → Patients → Hand Scanner → Recommendations → AI Insights review start-to-finish with a **real** Gemini key and the real ML model. (Auth/org-scoping from §1 is no longer a blocker — verified the admin-side dashboard flow works end-to-end in a real browser; the consumer-facing onboarding/hand-scan/recommendations flow still has no auth by design, per PRD Phase 3, and hasn't been walked with a real Gemini key.)
- [x] **Dataset ingestion — real, as of 2026-08-27.** `POST /v1/datasets` now accepts an actual CSV upload (`multer` + `csv-parse`, `server/routes/datasets.ts`), computes a real `rowCount` and `qualityScore` from row-level validation (no more hardcoded `0`), and — when the columns look like sales data — generates a genuine `sales_trend` AiOutput from the parsed rows (`server/services/datasetAnalysis.ts`), FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY labeled per §6.4. Verified end-to-end against the real Supplement Sales Kaggle CSV: 4,384 rows, 100% quality score, and a correct computed insight (top product by revenue, real MoM % change, a real return-rate flag). The raw file itself isn't persisted (no DB permission for a new table — see `data/DATA_PROVENANCE.md`), only the computed summary. Still true: the "Pharmaceutical Drugs and Vitamins" catalog dataset is an image dataset, not tabular, so this only works end-to-end for sales-shaped CSVs today — a real catalog data source is still needed for that use case.
- [x] Reports/export (PRD §6.5 / Journey C "exportable weekly summaries"): confirmed real — `Reports.tsx`'s `exportJSON()` builds a `Blob` and triggers a real file download (`.json`), not just an on-screen view.
- [x] **FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY labeling — was entirely missing, fixed 2026-08-27.** `AiInsightsDetail.tsx` had no rendering for these fields at all (its "Supporting Data" panel expected `period`/`change`/`value`/`expected` — fields nothing actually produces) and hardcoded "Model Version" to the literal string `hyg-v1` regardless of the real value. Added a real FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY panel and fixed Model Version to read `insight.modelVersion` (also had to add that field to the `GET /v1/ai/outputs` response, which was missing it — `server/routes/insights.ts`). Verified against the real sales_trend insight from §3's dataset ingestion work.
- [x] Audit Logs page reads real logged actions — the reviewer-attribution fix in §1 means `reviewedById` is now a real, non-spoofable user reference.

---

## 4. Backend (Render) readiness

- [ ] Set `GEMINI_API_KEY` as a real Render environment secret (never commit it).
- [x] **Resolved 2026-08-27.** `server/ml/requirements.txt` now pins scikit-learn/pandas/joblib to exactly what trained the model; numpy is one minor version back (2.4.6 vs. the training venv's 2.5.2) because the Docker image's Python 3.11 can't install numpy>=2.5 — first pin attempt matched the training venv exactly and broke the build outright (numpy needs Python 3.12), had to walk it back. Documented the remaining version gap in the file itself.
- [x] **Resolved 2026-08-27 — investigated fully, not just documented.** `data/faulty-valdation-set-f1-score-97.ipynb`'s filename flagged a known validation issue; verified directly against the raw dataset and found it fails any medical-grade bar (synthetic data, invented feature-mapping heuristic). `POST /v1/ai/predict` is now gated (503). Full writeup: `data/DATA_PROVENANCE.md`.
- [x] **Resolved 2026-08-27.** Added `.github/workflows/ci.yml` — runs on every push/PR to `main`, two jobs: frontend `npm run build` (`tsc -b && vite build`) and server `npm run build` (`tsc`). Both verified clean locally before pushing. Deliberately does not run `smoke.test.ts` in CI — that needs a live `DATABASE_URL` secret, which is a deliberate call for a human to make, not something to wire in silently. The Docker image itself still runs via `npx tsx index.ts` directly (unchanged, that's fine for runtime), but type errors now get caught on every push instead of only when someone remembers to run `tsc` locally.
- [x] Lock CORS down to the deployed Vercel origin(s) (see §1) — code done, real origin value still needs setting in Render.
- [x] **Migrated from SQLite to Postgres** (decided 2026-08-26). `server/prisma/schema.prisma` targets `provider = "postgresql"`. Actual database ended up on **Supabase** (`aws-0-ap-southeast-1.pooler.supabase.com`, role `hyg3_app`), not Render-provisioned Postgres — the `render.yaml` `hyg3-db` block is unused since the live Render service isn't deploying from `render.yaml` at all (see §5). Schema was pushed via `prisma db push` (the app role lacks `CREATEDB`, so `migrate dev`'s shadow-database step doesn't work — no formal migration history exists, matching how this project already worked with SQLite). Verified end-to-end: `hyg3_app` has full CRUD rights, `prisma/seed.ts` ran successfully, and the backend boots locally against it with working login + org-scoped `/v1/patients`.
- [x] **Resolved — verified live 2026-08-27.** Confirmed directly via the Render API (`GET /v1/services/srv-da7h5p142hec73bqar3g`): `healthCheckPath` is set to `/v1/health` on the actual live service (not just in the unused `render.yaml`). An uptime monitor beyond Render's own health check is still optional/not set up.
- [x] **Resolved 2026-08-26/27.** The live Render service wasn't deploying from `render.yaml` at all (plain Node runtime, wrong build/start commands, repo root instead of `server/`). Deleted it, created a proper Docker-runtime service (`hyg3-backend`, `srv-da7h5p142hec73bqar3g`) via the Render API pointed at `server/Dockerfile`, with `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` set. Also had to fix a real Dockerfile bug found in the process: `npm install` ran before `COPY . .`, so Prisma's postinstall `generate` had no schema to work from — container crashed on boot. Confirmed live and stable across many redeploys since.

---

## 5. Frontend (Vercel) deploy readiness

- [x] **Superseded 2026-08-26.** The original `hyg3` project's ownership was never resolved. Rather than chase it, the account holder created a fresh project (`hyg-3`, `hyg-3.vercel.app`) under their own account and connected it to GitHub directly. `.vercel/project.json` in this repo is now stale (still points at the old `hyg3` project) — harmless, since deploys go through Vercel's own GitHub integration, not this file, but worth deleting or updating so it stops being misleading.
- [ ] **STILL BROKEN — re-verified 2026-08-27, this is the top-priority open item.** `VITE_API_URL` is still not correctly set as a Vercel Production environment variable. Re-checked directly by `grep`-ing the live JS bundle content (not just comparing hashes, in case a rebuild happened but produced byte-identical output): `hyg-3.vercel.app`'s deployed bundle still contains literal `localhost:3000`, four pushes to `main` after the user reported this fixed. I also re-confirmed I have no API access to this project — `mcp__claude_ai_Vercel__list_projects` on the connected team (`libralyticsadmins-projects`) only returns an unrelated project (`libot-th`), same as the earlier check. **This needs the user directly in the Vercel dashboard:** `hyg-3` project → Settings → Environment Variables → confirm `VITE_API_URL` = `https://hyg3-backend.onrender.com/v1` is actually saved with **Production** scope checked (not just Preview/Development) → Deployments tab → trigger a redeploy → I can re-verify the bundle content once that's done.
- [x] `npm run build` verified clean repeatedly throughout this session (`tsc -b && vite build`, zero errors) — confirmed as recently as this check.
- [x] Superseded — see the first item above. Auto-deploy on push confirmed working (many commits, many successful Vercel rebuilds) since `hyg-3` was connected.
- [x] `vercel.json`'s SPA rewrite — confirmed correct, no action needed.
- [x] **Resolved.** `index.html` now has a real `<meta name="description">`, Open Graph tags (`og:type/title/description`), and Twitter card tags. No `og:image` yet (no social-card asset exists) — deliberately omitted rather than pointing at a broken path.
- [ ] Add a custom domain in Vercel project settings if the pilot needs one. Still open, optional.
- [ ] Smoke-test the deployed Vercel frontend against the deployed Render backend end-to-end. **Blocked by the `VITE_API_URL` item above** — can't meaningfully smoke-test a frontend that's calling `localhost:3000`.

---

## 6. Compliance/legal loose ends (before any real, non-synthetic data)

- [x] **Investigated 2026-08-27 — worse than this item assumed.** There wasn't a consent checkbox to review the copy of — `server/routes/onboarding.ts` hardcoded `pdpaConsentStatus: true` and a real `consentTimestamp` on every signup unconditionally, regardless of any user action. Fixed the structural gap: added a real, required, unchecked-by-default consent checkbox to `Onboarding.tsx` (all 4 locales) that the backend now actually validates before accepting a submission. **Still open:** the consent wording itself is placeholder copy I wrote, not reviewed by Thai legal counsel — do not treat it as meeting PRD §10's "explicit consent" bar on its own.
- [ ] Thai FDA / health-claims legal review of AI-generated copy (recommendations, hand-scan disclaimers, any sales-trend language) — PRD §10 flags this as unresolved.
- [ ] Legal/DPA sign-off before any real partner or patient data (as opposed to seeded/synthetic data) touches this system.
- [x] Resolved — see `decisions.md` and §1's compliance-conflict item above. Research-only, enforced.

---

## 7. Nice-to-have before calling it MVP-done

- [x] **Resolved 2026-08-27.** `server/test/smoke.test.ts` (`npm test`, Node's built-in test runner, zero new dependencies) — 6 tests: health check, the `/v1/ai/predict` 503 gate as a regression guard, `/v1/onboard` success + missing-fields + missing-consent validation, and auth rejection on protected routes. Verified passing locally and the changes that motivated two of them (the consent check, the gate) are confirmed live in production.
- [x] **Resolved 2026-08-27.** Added a shared `ErrorBanner` component, wired into DashboardOverview, AiInsightsList, Patients, and Datasets — all four previously swallowed fetch errors via `.catch(console.error)` with zero user-visible feedback.
- [ ] Audit loading/empty states across pages that fetch data — partially covered by the above, not a full formal pass.
