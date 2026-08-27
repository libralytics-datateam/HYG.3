# HYG.3 — MVP Completion & Deployment Checklist

Snapshot date: 2026-08-22, last swept for accuracy 2026-08-27. Based on reading the current codebase (not the roadmap docs alone) — items reference actual files/lines so they're actionable.

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
- [ ] `GEMINI_API_KEY` is blank in `server/.env`, so hand-scan "analysis" silently falls back to the canned `getSimulatedAnalysis()` response (`services/geminiService.ts:36-38`) with no indicator in the UI that it isn't real. Either set a real key before pilot, or surface a visible "demo mode" flag so nobody mistakes it for a real read.
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
- [ ] The server's own `npm run build` (tsc) is never actually invoked in the Docker image — it runs via `npx tsx index.ts` directly, so TypeScript errors won't be caught at build time. Consider running `tsc --noEmit` in CI at minimum.
- [x] Lock CORS down to the deployed Vercel origin(s) (see §1) — code done, real origin value still needs setting in Render.
- [x] **Migrated from SQLite to Postgres** (decided 2026-08-26). `server/prisma/schema.prisma` targets `provider = "postgresql"`. Actual database ended up on **Supabase** (`aws-0-ap-southeast-1.pooler.supabase.com`, role `hyg3_app`), not Render-provisioned Postgres — the `render.yaml` `hyg3-db` block is unused since the live Render service isn't deploying from `render.yaml` at all (see §5). Schema was pushed via `prisma db push` (the app role lacks `CREATEDB`, so `migrate dev`'s shadow-database step doesn't work — no formal migration history exists, matching how this project already worked with SQLite). Verified end-to-end: `hyg3_app` has full CRUD rights, `prisma/seed.ts` ran successfully, and the backend boots locally against it with working login + org-scoped `/v1/patients`.
- [ ] Wire the existing `/v1/health` endpoint into Render's health checks / an uptime monitor. Still open — Render's `healthCheckPath` service setting was never set.
- [x] **Resolved 2026-08-26/27.** The live Render service wasn't deploying from `render.yaml` at all (plain Node runtime, wrong build/start commands, repo root instead of `server/`). Deleted it, created a proper Docker-runtime service (`hyg3-backend`, `srv-da7h5p142hec73bqar3g`) via the Render API pointed at `server/Dockerfile`, with `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` set. Also had to fix a real Dockerfile bug found in the process: `npm install` ran before `COPY . .`, so Prisma's postinstall `generate` had no schema to work from — container crashed on boot. Confirmed live and stable across many redeploys since.

---

## 5. Frontend (Vercel) deploy readiness

- [x] **Superseded 2026-08-26.** The original `hyg3` project's ownership was never resolved. Rather than chase it, the account holder created a fresh project (`hyg-3`, `hyg-3.vercel.app`) under their own account and connected it to GitHub directly. `.vercel/project.json` in this repo is now stale (still points at the old `hyg3` project) — harmless, since deploys go through Vercel's own GitHub integration, not this file, but worth deleting or updating so it stops being misleading.
- [ ] **STILL BROKEN as of 2026-08-27 — this is the top-priority open item.** `VITE_API_URL` was never actually set as a Vercel Production environment variable, despite being asked for twice. Confirmed by extracting the live JS bundle from `hyg-3.vercel.app` directly: it still has `http://localhost:3000` baked in. This means **the entire admin dashboard — login and everything behind it — is non-functional in production right now.** Needs: Project Settings → Environment Variables → `VITE_API_URL` = `https://hyg3-backend.onrender.com/v1`, scoped to Production → trigger a redeploy → re-verify by re-checking the deployed bundle.
- [x] `npm run build` verified clean repeatedly throughout this session (`tsc -b && vite build`, zero errors) — confirmed as recently as this check.
- [x] Superseded — see the first item above. Auto-deploy on push confirmed working (many commits, many successful Vercel rebuilds) since `hyg-3` was connected.
- [x] `vercel.json`'s SPA rewrite — confirmed correct, no action needed.
- [ ] `index.html`: title (`HYGE — Wellness Before Illness`) is real, not a Vite default — but there's **no meta description and no Open Graph tags at all**. Worth adding before this is shared/linked anywhere (search snippets and social previews will look broken/generic otherwise).
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
