# HYG.3 — MVP Completion & Deployment Checklist

Snapshot date: 2026-08-22. Based on reading the current codebase (not the roadmap docs alone) — items reference actual files/lines so they're actionable.

**Deploy split (decided):** frontend (Vite/React) → Vercel. Backend (Express + Prisma/Postgres + Python ML subprocess + Gemini vision) stays on Render, as `render.yaml` already targets. Nothing here migrates the backend to Vercel serverless.

---

## 0. Repo hygiene (do this first — there is no git repo yet)

- [x] `git init` — done, initial commit `a6971ce` (311 files, working tree clean).
- [x] Fix root `.gitignore`: now excludes `.env`, `.env.*` (with `!.env.example` allowed through), `*.db`/`*.sqlite*`, and Python venv/cache dirs.
- [x] Add `data/.venv/` and Python cache/checkpoint dirs to `.gitignore` — verified via `git check-ignore` that `data/.venv` is excluded; the 4 real source files in `data/` (2 notebooks, 2 scripts) are tracked normally.
- [x] Confirmed `server/prisma/dev.db` is excluded (added `*.db` to `server/.gitignore`, which already had `.env`).
- [x] Added `.env.example` (root) and `server/.env.example` documenting required vars (`VITE_API_URL`; `DATABASE_URL`, `GEMINI_API_KEY`) now that real `.env` files are gitignored.
- [x] Pushed to GitHub (`libralytics-datateam/HYG.3`, private).
- [ ] Connect the Vercel project (`hyg3`) to that repo so pushes trigger deploys/previews. GitHub App access is granted, but `vercel git connect` / the dashboard "Connect" button both hang without erroring — looks like a transient platform-side issue, not a permissions problem. Retry later; deploys still work fine via `vercel --prod` CLI in the meantime.

---

## 1. Security & correctness gaps (fix before any real user touches this)

- [x] **Authentication/authorization built.** JWT-based login (`POST /v1/auth/login`, `GET /v1/auth/me`) with bcrypt-hashed passwords (`User.passwordHash`, new schema field), `requireAuth`/`requireRole` middleware (`server/middleware/auth.ts`), a login page + route guard on the frontend (`src/pages/Auth/Login.tsx`, `src/components/RequireAuth.tsx`, `src/context/AuthContext.tsx`). All admin/B2B routers (`ai`, `insights`, `patients`, `datasets`, `stats`, `products`) now require a valid token. **Also fixed a bigger bug found in the process:** every one of those routes was returning data across *all* orgs with zero filtering (`patient.findMany()`, `dataset.findMany()`, etc. had no `where` clause at all) — now every query is scoped to `req.user.orgId`. Verified end-to-end via curl (401 without token, org-scoped data with one) and in a real browser (login → dashboard → approve an insight → logout → `/app` bounces back to `/login`).
- [x] `server/routes/ai.ts` (`/v1/ai/predict`) no longer uses `findFirst()` guesses — it takes `orgId` from the authenticated session and requires a real `patientId` in the body, checked against that org.
- [x] `src/pages/App/AiInsightsDetail.tsx:54`'s `reviewerId: 'mock-reviewer-id'` is gone — the backend now derives `reviewedById` from the authenticated token only, never the client body. Verified in the DB after a live review action: `reviewedBy: sarah@libralytics.com`, not a mock value.
- [x] CORS locked to an allowlist via `CORS_ORIGIN` env var (comma-separated origins, defaults to `http://localhost:5173`) instead of wide-open `cors()` — `server/index.ts`. **Still needs the real Vercel production origin set as `CORS_ORIGIN` in Render once the frontend domain is confirmed** (blocked on the Vercel account mismatch noted in §5).
- [ ] `GEMINI_API_KEY` is blank in `server/.env`, so hand-scan "analysis" silently falls back to the canned `getSimulatedAnalysis()` response (`services/geminiService.ts:36-38`) with no indicator in the UI that it isn't real. Either set a real key before pilot, or surface a visible "demo mode" flag so nobody mistakes it for a real read.
- [ ] `requireRole(...roles)` middleware exists but isn't applied anywhere yet — right now any authenticated org member can review/approve insights regardless of role (e.g. `Lead Clinician` vs `Pharmacist`). Roles are currently free-form strings from seed data, not the PRD's fixed enum (`org_admin`/`analyst`/`pharmacist`/`it_admin`) — worth deciding the real role set before gating specific actions by role.
- [ ] Local dev login: `sarah@libralytics.com` / `marcus@libralytics.com`, password `password123` (seeded via `server/prisma/seed.ts`) — demo-only, rotate before any real pilot data.
- [x] **PRD §13 compliance conflict — resolved 2026-08-27.** The PRD explicitly says the Vitamin Deficiency Prediction model must never be "wired into a user-facing output" and may only be used PROTOTYPE/internal, but `server/routes/ai.ts` (line 24 above) was doing exactly that. Investigated further and found the underlying data doesn't meet any medical-grade bar at all — see `data/DATA_PROVENANCE.md` for the full assessment (synthetic training data with a publicly-documented faulty-validation issue, plus an unvalidated invented heuristic in the runtime feature mapping). `POST /v1/ai/predict` now returns 503 unconditionally; the model/script files remain as research artifacts per PRD §13's PROTOTYPE allowance, just unreachable from any live route. No frontend code called this endpoint, so nothing user-visible broke.

---

## 2. Static pages that need real wiring (or should be cut from MVP)

- [ ] `src/pages/App/Team.tsx` — fully hardcoded array; "Invite Member" button does nothing. PRD's MVP scope (§6) doesn't call for self-serve team management — recommend cutting this from MVP nav rather than shipping a dead button.
- [ ] `src/pages/App/Organization.tsx` — profile form and billing "Upgrade" button aren't wired to anything. Same call: cut from MVP or wire to a real settings endpoint.
- [ ] `src/pages/Marketing/Contact.tsx` — form has no submit handler; messages currently go nowhere.
- [ ] `src/pages/App/Models.tsx` — worth a quick check whether it reflects the real deployed model version or is also static.

---

## 3. Core MVP flows — finish and test end-to-end

- [ ] Walk Onboarding → Patients → Hand Scanner → Recommendations → AI Insights review start-to-finish with a **real** Gemini key and the real ML model. (Auth/org-scoping from §1 is no longer a blocker — verified the admin-side dashboard flow works end-to-end in a real browser; the consumer-facing onboarding/hand-scan/recommendations flow still has no auth by design, per PRD Phase 3, and hasn't been walked with a real Gemini key.)
- [x] **Dataset ingestion — real, as of 2026-08-27.** `POST /v1/datasets` now accepts an actual CSV upload (`multer` + `csv-parse`, `server/routes/datasets.ts`), computes a real `rowCount` and `qualityScore` from row-level validation (no more hardcoded `0`), and — when the columns look like sales data — generates a genuine `sales_trend` AiOutput from the parsed rows (`server/services/datasetAnalysis.ts`), FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY labeled per §6.4. Verified end-to-end against the real Supplement Sales Kaggle CSV: 4,384 rows, 100% quality score, and a correct computed insight (top product by revenue, real MoM % change, a real return-rate flag). The raw file itself isn't persisted (no DB permission for a new table — see `data/DATA_PROVENANCE.md`), only the computed summary. Still true: the "Pharmaceutical Drugs and Vitamins" catalog dataset is an image dataset, not tabular, so this only works end-to-end for sales-shaped CSVs today — a real catalog data source is still needed for that use case.
- [ ] Reports/export (PRD §6.5 / Journey C "exportable weekly summaries"): confirm `Reports.tsx` actually produces a downloadable file, not just an on-screen view.
- [ ] Confirm every AI output renders the required FACT / INFERENCE / RECOMMENDATION / UNCERTAINTY labeling (PRD §6.4) across all output types in `AiInsightsDetail.tsx`, not just the hand-scan disclaimer.
- [x] Audit Logs page reads real logged actions — the reviewer-attribution fix in §1 means `reviewedById` is now a real, non-spoofable user reference.

---

## 4. Backend (Render) readiness

- [ ] Set `GEMINI_API_KEY` as a real Render environment secret (never commit it).
- [ ] Pin ML dependencies: `server/Dockerfile` runs `pip install --no-cache-dir scikit-learn pandas` with **no version pins and no `requirements.txt`**. If the installed version drifts from whatever version originally pickled `vitamin_model.pkl`/`label_encoder.pkl`, predictions can silently break or change. Add a pinned `requirements.txt` and match it to the training environment.
- [ ] Note: `data/faulty-valdation-set-f1-score-97.ipynb`'s filename flags a known validation issue — resolve or document it before trusting this model's confidence scores in any pilot-facing output.
- [ ] The server's own `npm run build` (tsc) is never actually invoked in the Docker image — it runs via `npx tsx index.ts` directly, so TypeScript errors won't be caught at build time. Consider running `tsc --noEmit` in CI at minimum.
- [x] Lock CORS down to the deployed Vercel origin(s) (see §1) — code done, real origin value still needs setting in Render.
- [x] **Migrated from SQLite to Postgres** (decided 2026-08-26). `server/prisma/schema.prisma` targets `provider = "postgresql"`. Actual database ended up on **Supabase** (`aws-0-ap-southeast-1.pooler.supabase.com`, role `hyg3_app`), not Render-provisioned Postgres — the `render.yaml` `hyg3-db` block is unused since the live Render service isn't deploying from `render.yaml` at all (see §5). Schema was pushed via `prisma db push` (the app role lacks `CREATEDB`, so `migrate dev`'s shadow-database step doesn't work — no formal migration history exists, matching how this project already worked with SQLite). Verified end-to-end: `hyg3_app` has full CRUD rights, `prisma/seed.ts` ran successfully, and the backend boots locally against it with working login + org-scoped `/v1/patients`.
- [ ] Wire the existing `/v1/health` endpoint into Render's health checks / an uptime monitor.
- [ ] **Blocker found 2026-08-26: the live Render service isn't deploying from this repo's `render.yaml`.** An exported config shows a plain `runtime: node` web service running `npm install; npm run build` / `npm run start` at the **repo root** (the frontend's scripts — `start` launches `vite` dev server + `tsx` backend via `concurrently`), not the `Dockerfile`-based backend-only service `render.yaml` describes. This means: the Python/ML deps from `Dockerfile` never get installed, and production is likely serving a dev-mode Vite server instead of a built bundle. Needs fixing in the Render dashboard (recreate as a Blueprint from `render.yaml`, or manually switch the service to Docker runtime pointing at `server/Dockerfile`) before this is a real production deploy. `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, and `CORS_ORIGIN` all need setting as env vars on whatever service ends up live.

---

## 5. Frontend (Vercel) deploy readiness

- [ ] **Blocker found 2026-08-26: Vercel project ownership unclear.** `.vercel/project.json` in this repo points at a project named `hyg3` under team `team_LxB9wIsUwY3imK1FHUuYHXH3`, but the Vercel account currently connected to this session only has access to a different project (`libot-th`) under that same team — `hyg3` doesn't show up. Either a different Vercel account owns `hyg3` (the one previously used for `vercel --prod` CLI deploys per §0), or it needs to be recreated fresh. Needs the account holder to confirm before any frontend deploy can proceed.
- [ ] Set `VITE_API_URL` as a Vercel **Environment Variable** (Production) pointing at the Render backend, rather than relying only on the committed `.env.production` file. Note: `.env.production` currently points at `https://hyg3-backend.onrender.com/v1`, but the actual live Render URL seen so far is `https://hyg-3.onrender.com` — reconcile once §4's Render service is fixed.
- [ ] Run `npm run build` locally and confirm it's currently clean (`tsc -b && vite build`) — fix any TypeScript errors before wiring up CI-based deploys.
- [ ] Once git is initialized, reconnect the existing linked project (`hyg3`) to the GitHub repo in Vercel's dashboard so pushes generate preview/production deploys automatically.
- [ ] `vercel.json`'s SPA rewrite is already correct — no action needed there.
- [ ] Check `index.html` title/meta description/OG tags — confirm they're production copy, not Vite template defaults.
- [ ] Add a custom domain in Vercel project settings if the pilot needs one.
- [ ] Smoke-test the deployed Vercel frontend against the deployed Render backend (CORS with the real prod origin, HTTPS end-to-end).

---

## 6. Compliance/legal loose ends (before any real, non-synthetic data)

- [ ] Confirm the Onboarding UI actually captures explicit PDPA consent language — the `Patient` model has `pdpaConsentStatus`/`consentTimestamp` fields, but verify the UI copy meets the "explicit consent" bar PRD §10 calls for, not just an account-creation checkbox.
- [ ] Thai FDA / health-claims legal review of AI-generated copy (recommendations, hand-scan disclaimers, any sales-trend language) — PRD §10 flags this as unresolved.
- [ ] Legal/DPA sign-off before any real partner or patient data (as opposed to seeded/synthetic data) touches this system.
- [ ] Resolve PRD Open Question #4: is the Vitamin Deficiency Prediction feature staying research-only, or is there a decision to productionize it? Record the answer — it directly determines whether §1's compliance-conflict item is a blocker.

---

## 7. Nice-to-have before calling it MVP-done

- [ ] `server/package.json`'s `test` script is a stub (`echo "Error: no test specified"`) — add at least a couple of API smoke tests for `/v1/ai/predict` and `/v1/onboard`.
- [ ] Add user-facing error states for failed API calls across the dashboard (currently unclear if any exist).
- [ ] Audit loading/empty states across pages that fetch data.
