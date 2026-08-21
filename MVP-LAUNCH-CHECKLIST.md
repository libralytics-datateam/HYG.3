# HYG.3 — MVP Completion & Deployment Checklist

Snapshot date: 2026-08-22. Based on reading the current codebase (not the roadmap docs alone) — items reference actual files/lines so they're actionable.

**Deploy split (decided):** frontend (Vite/React) → Vercel. Backend (Express + Prisma/SQLite + Python ML subprocess + Gemini vision) stays on Render, as `render.yaml` already targets. Nothing here migrates the backend to Vercel serverless.

---

## 0. Repo hygiene (do this first — there is no git repo yet)

- [ ] `git init` — this project has never been committed.
- [ ] Fix root `.gitignore`: it currently does **not** exclude `.env`, `.env.production`, `*.db`, or any Python venv. Add those before the first commit.
- [ ] Add `data/.venv/` (a full Python virtualenv sitting in the repo) and `data/*.ipynb` checkpoints to `.gitignore`, or move `data/` out of this repo entirely — it's training/exploration material, not app source.
- [ ] Make sure `server/prisma/dev.db` (a live SQLite file with real rows) never gets committed — `server/.gitignore` already excludes `.env` but not `*.db`.
- [ ] Push to GitHub, then connect the existing linked Vercel project (`hyg3`, per `.vercel/project.json`) to that repo so pushes trigger deploys/previews instead of relying on manual `vercel` CLI pushes.

---

## 1. Security & correctness gaps (fix before any real user touches this)

- [ ] **No authentication/authorization anywhere.** No login page, no JWT/session, no enforcement of the `role` field that already exists on `User` in the Prisma schema. PRD §9 requires org→role→permission isolation enforced at the data layer — this is the single biggest gap between current code and MVP.
- [ ] `server/routes/ai.ts` (`/v1/ai/predict`) calls `prisma.organization.findFirst()` and `prisma.patient.findFirst()` instead of resolving org/patient from an authenticated request — every prediction currently lands on whatever row happens to be first in the table, not the actual caller.
- [ ] `src/pages/App/AiInsightsDetail.tsx:54` posts `reviewerId: 'mock-reviewer-id'` on every review action — the audit trail (PRD §6.4, a named MVP requirement) isn't attributing real reviewers.
- [ ] CORS is wide open — `server/index.ts:16` is `app.use(cors())` with no origin allowlist. Restrict to the deployed Vercel domain(s) before go-live.
- [ ] `GEMINI_API_KEY` is blank in `server/.env`, so hand-scan "analysis" silently falls back to the canned `getSimulatedAnalysis()` response (`services/geminiService.ts:36-38`) with no indicator in the UI that it isn't real. Either set a real key before pilot, or surface a visible "demo mode" flag so nobody mistakes it for a real read.
- [ ] **PRD §13 compliance conflict:** the PRD explicitly says the Vitamin Deficiency Prediction model must never be "wired into a user-facing output" and may only be used PROTOTYPE/internal. The current code does exactly the opposite — `server/routes/ai.ts` + `server/ml/predict.py` serve a live prediction straight into a generated "Custom Vitamin Concept" shown in the AI Insights UI. This needs a product/compliance decision, not just engineering: either get this feature formally re-scoped into MVP with the checklist in PRD §5, or gate it out from anything patient-visible until pharmacist review + legal sign-off exists.

---

## 2. Static pages that need real wiring (or should be cut from MVP)

- [ ] `src/pages/App/Team.tsx` — fully hardcoded array; "Invite Member" button does nothing. PRD's MVP scope (§6) doesn't call for self-serve team management — recommend cutting this from MVP nav rather than shipping a dead button.
- [ ] `src/pages/App/Organization.tsx` — profile form and billing "Upgrade" button aren't wired to anything. Same call: cut from MVP or wire to a real settings endpoint.
- [ ] `src/pages/Marketing/Contact.tsx` — form has no submit handler; messages currently go nowhere.
- [ ] `src/pages/App/Models.tsx` — worth a quick check whether it reflects the real deployed model version or is also static.

---

## 3. Core MVP flows — finish and test end-to-end

- [ ] Walk Onboarding → Patients → Hand Scanner → Recommendations → AI Insights review start-to-finish with a **real** Gemini key and the real ML model, and confirm data lands against the correct org/patient (blocked on the auth fix in §1).
- [ ] Dataset ingestion (PRD §6.1: "ingest CSV/API exports"): the current "Register Dataset" modal (`src/pages/App/Datasets.tsx`) only captures a name + type — there's no actual file upload or CSV parsing yet. Decide if real ingestion is in MVP scope or if manual registration is acceptable for the pilot.
- [ ] Reports/export (PRD §6.5 / Journey C "exportable weekly summaries"): confirm `Reports.tsx` actually produces a downloadable file, not just an on-screen view.
- [ ] Confirm every AI output renders the required FACT / INFERENCE / RECOMMENDATION / UNCERTAINTY labeling (PRD §6.4) across all output types in `AiInsightsDetail.tsx`, not just the hand-scan disclaimer.
- [ ] Audit Logs page — confirm it reads real logged actions (tied to the reviewerId fix above), not placeholder rows.

---

## 4. Backend (Render) readiness

- [ ] Set `GEMINI_API_KEY` as a real Render environment secret (never commit it).
- [ ] Pin ML dependencies: `server/Dockerfile` runs `pip install --no-cache-dir scikit-learn pandas` with **no version pins and no `requirements.txt`**. If the installed version drifts from whatever version originally pickled `vitamin_model.pkl`/`label_encoder.pkl`, predictions can silently break or change. Add a pinned `requirements.txt` and match it to the training environment.
- [ ] Note: `data/faulty-valdation-set-f1-score-97.ipynb`'s filename flags a known validation issue — resolve or document it before trusting this model's confidence scores in any pilot-facing output.
- [ ] The server's own `npm run build` (tsc) is never actually invoked in the Docker image — it runs via `npx tsx index.ts` directly, so TypeScript errors won't be caught at build time. Consider running `tsc --noEmit` in CI at minimum.
- [ ] Lock CORS down to the deployed Vercel origin(s) (see §1).
- [ ] SQLite + a single Render disk (already configured in `render.yaml`) is fine for a single-instance pilot but won't survive a multi-instance/scale-out setup — flag as a known Phase 2 limit, not a blocker for one pilot partner.
- [ ] Wire the existing `/v1/health` endpoint into Render's health checks / an uptime monitor.

---

## 5. Frontend (Vercel) deploy readiness

- [ ] Set `VITE_API_URL` as a Vercel **Environment Variable** (Production) pointing at the Render backend, rather than relying only on the committed `.env.production` file.
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
