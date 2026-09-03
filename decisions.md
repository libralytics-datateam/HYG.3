# HYG.3 — Decisions Log

Tracks product/scope decisions referenced from `prd.md`, in the order they were made. Each entry: the question, the answer, the date, who/what settled it, and where the evidence lives. Add to this file — don't restate its history — when a new decision is made.

---

## Pilot partner selection

**Question** (`prd.md` §15.1): Which pilot partner (pharmacy group, supplement retailer, or wellness business) is realistically committable in the next 60–90 days?

**Status: OPEN — not yet answered.** No partner name, org, or negotiation status has been recorded anywhere in this repo as of 2026-08-27. This is a business-development status that lives outside the codebase — record it here as soon as there's an answer, even a partial one ("in talks with X, nothing signed").

---

## Vitamin Deficiency Disease Prediction dataset: research-only

**Question** (`prd.md` §15.4, originally): Does the Vitamin Deficiency Disease Prediction dataset stay research-only indefinitely, or is there roadmap intent to build a governed clinical feature from it later?

**Decision: Research-only, enforced at the code level.** `POST /v1/ai/predict` returns 503 unconditionally.

**Date:** 2026-08-27
**Why:** Investigated the underlying data directly (not just the PRD's existing caution) and found it fails any reasonable medical-grade bar: the training data is synthetic/procedurally-generated (confirmed via floating-point generation artifacts in the raw CSV), a public Kaggle kernel already documents that the dataset's widely-cited 97% F1 score is a validation-methodology artifact, and the runtime WHOOP-to-symptom feature mapping in `server/ml/predict.py` is a second, independent, never-validated heuristic layered on top.
**Evidence:** `data/DATA_PROVENANCE.md` (full assessment), `server/routes/ai.ts` (the gate itself), `prd.md` §13.
**Revisit when:** real, clinically-sourced, properly-licensed training data exists — see `data/DATA_PROVENANCE.md` "Path forward" for what that requires (explicit research-use consent, clinical validation, the same specialist/FDA gates as everything else diagnosis-adjacent).

---

## Public `/roadmap` vision page: built, then removed

**Decision:** A marketing page describing the long-term medical-grade vision (lifespan tracking → preventive care → cancer detection → personalized healthcare → microbiome) was built, then removed the same day.

**Date:** 2026-08-27
**Why:** Decided to prioritize actually building real infrastructure over publishing an aspirational page — especially given the Vitamin Deficiency dataset was found illegitimate the same day (above). Publishing a "cancer detection" vision page while sitting on a debunked prediction model risked the wrong signal. The vision itself is still recorded — see `prd.md` §14 and `mvp-roadmap.md` Phase 7+ — just not as a public-facing page yet.
**Revisit when:** there's real progress to show (see `data/DATA_PROVENANCE.md` "Path forward" and the `GET /v1/stats/data-readiness` counts on the admin Models page) — not before.

---

## Supplement Sales / Pharmaceutical & Vitamins dataset provenance

**Question** (`prd.md` §15.2): Can the Supplement Sales Data and Pharmaceutical Drugs and Vitamins datasets be confirmed as real partner data or clearly-labeled public/synthetic data?

**Status: ANSWERED 2026-08-27.** Neither is real partner data, and one isn't usable for its described purpose at all:
- **Supplement Sales Data**: confirmed public/synthetic-style demo data (generic Canada/UK/USA e-commerce activity, no Thailand presence, no tie to any real business). Structurally clean, fine for prototyping dashboard UI, not representative of an actual pilot partner.
- **Pharmaceutical Drugs and Vitamins Dataset V2**: turns out to be a 51,104-image pill/box-photo classification dataset of Philippine OTC drug brands, not the tabular catalog/product-info data `prd.md` §6 assumed it was. It cannot serve the SKU catalog use case in §6.1/§6.3 regardless of legitimacy — this was a dataset-selection mismatch, not just a provenance question.
- Also found, while checking: a fourth resource (`utkarshsaxenadn/drugs-and-vitamins-classification`) turns out to be a third party's pretrained CNN model file, not a dataset. Unused by any code path; recommend leaving it unused rather than trying to vet an opaque black-box model with no visible training methodology.

**Evidence:** `data/DATA_PROVENANCE.md` "Assessment of the other three resources."

---

## Legal/privacy/Thai FDA review ownership

**Question** (`prd.md` §15.3): Who at Libralytics owns the legal/privacy and Thai FDA advertising-claims review before any pilot data or AI-generated sales copy goes live?

**Status: OPEN — not yet answered.**

---

## Wearable integration: WHOOP now, Apple Watch deferred

**Question:** User asked to link WHOOP or Apple Watch data for deeper analysis — which, and how much?

**Status: ANSWERED 2026-08-27.** Build WHOOP as a real OAuth 2.0 integration now (`server/services/whoopService.ts`, `server/routes/wearables.ts`, `WhoopConnectCard`); defer Apple Watch. Reason: they're not the same kind of work. WHOOP has a public server-callable OAuth API. Apple HealthKit has no cloud API at all — the only paths in are a native iOS companion app (this project has none) or a paid third-party aggregator (Terra/Vital/Spike), which is a bigger product/vendor decision, not scoped here. Building a WHOOP-shaped "connect" button for Apple would have been fake, the same category of problem as everything else in this log.

Needs a real WHOOP developer account (register free at https://developer.whoop.com) and `WHOOP_CLIENT_ID`/`WHOOP_CLIENT_SECRET`/`WHOOP_REDIRECT_URI` set as real Render secrets before it does anything in production — currently `whoopConfigured: false`, and the UI says so honestly instead of failing silently.

**Also found in the process:** 4 live pages (`/how-it-works`, `/product`, `/trust`, and `PrivacyPolicy`) making claims that didn't match reality — a working Apple Health integration that was never built at all, a "live" prediction engine that's actually the model gated in `data/DATA_PROVENANCE.md`, and (most seriously) the Trust Center claiming "fully HIPAA compliant" infrastructure — wrong jurisdiction entirely; this is a Thai company under PDPA, not a US HIPAA-covered entity, no BAA or HIPAA audit exists. All four rewritten to state only what's true. See `MVP-LAUNCH-CHECKLIST.md` §8 for the full list.

**Evidence:** `server/services/whoopService.ts`, `server/routes/wearables.ts`, `MVP-LAUNCH-CHECKLIST.md` §8.

---

## Phase 5 data layer: built the biometric side, product catalog remains unresolved

**Question:** `mvp-roadmap.md` Phase 5 needs "biometrics mapped to the product catalog." What data actually exists to build that on?

**Status: PARTIALLY ANSWERED 2026-08-28.** The biometric side is real and ready: hand scans now write to `BiometricReading` (they never did before — `server/routes/handscan.ts`, `metricType: 'antioxidant_score'`), and a new `GET /v1/patients/:id/biometric-summary` aggregates real accumulated signal (latest value, trend, reading count per metric) from both hand scans and WHOOP. Surfaced on the admin `PatientDetail` page. No recommendation logic was built on top of this — that still needs its own scoping conversation.

**The product-catalog side has zero real data**, and this wasn't a gap I could close by building more: `Product` (schema: sku/name/category/ingredients/dosageForm) has **0 rows** — not even seed data. The one Kaggle resource that looked like it might cover this (`Pharmaceutical Drugs and Vitamins Dataset V2`) turned out to be 51,104 product-packaging *photos*, not a tabular catalog — see `data/DATA_PROVENANCE.md`. There is currently no source, real or synthetic, for what a Thai pharmacy's actual SKU catalog looks like. This needs an actual sourcing decision (a partner's real catalog export, once a pilot partner is chosen — see the still-open "Pilot partner selection" entry above) — not something to fabricate placeholder rows for.

**Also found and fixed while building this:** `hyg3_app` can't `ALTER TABLE` on existing tables, not just `CREATE TABLE` — confirmed via a failed `prisma db push` (`must be owner of table AiOutput`). More restrictive than previously documented; see the correction in `MVP-LAUNCH-CHECKLIST.md` §4.

**Evidence:** `server/routes/handscan.ts`, `server/routes/patients.ts` (`biometric-summary`), `src/pages/App/PatientDetail.tsx`, `MVP-LAUNCH-CHECKLIST.md` §4 and §8.

---

## More data gathering for better analysis: self-report check-in built, ranked ahead of adherence tracking and lab integration

**Question:** User asked whether more data should be gathered from patients to improve analysis quality.

**Status: ANSWERED 2026-08-28.** Recommended and built, in priority order: (1) a structured self-report symptom/wellness check-in — built now, see `MVP-LAUNCH-CHECKLIST.md` §9; (2) outcome tracking over time (does a recommendation actually help?) — not built, needs a design decision on cadence/UX; (3) supplement adherence tracking — deprioritized, typically low compliance in consumer apps; (4) lab results — real ground truth, but a clinical-lab partnership is a much bigger lift than anything else here (WHOOP's own spec has a "Partner" API for exactly this — lab requisitions via a company called Unilabs — worth remembering if a lab partnership is ever pursued).

Deliberately did not reach for another public dataset to fill this gap — every one of the above should come from this product's own patients, with real consent, which is the same lesson `data/DATA_PROVENANCE.md` already drew from the original vitamin-deficiency dataset.

**Evidence:** `server/routes/checkins.ts`, `src/pages/Client/CheckIn.tsx`, `MVP-LAUNCH-CHECKLIST.md` §9.

**Follow-up, 2026-08-28: outcome tracking (item 2 on that list) built.** Trend history (up to 20 points) now flows from both hand-scan/WHOOP data and the new self-report check-ins into a real sparkline, visible to both the clinician (`PatientDetail`) and the patient themselves (`CheckInCard`). Scoped deliberately narrow: this shows *whether a metric is trending*, not *whether a specific recommendation caused it* — tying a trend to a recommendation's timing needs real longitudinal data to do responsibly, which doesn't exist yet.

**Follow-up, 2026-08-28: adherence tracking (item 3) built.** One question added to the existing check-in — "did you follow your recommended plan?" (Yes/Partially/No) — shown only when a recommendation actually exists. Deliberately not a per-supplement checklist; kept to the smallest real question given self-logged adherence's known compliance problems in consumer apps. Lab integration (item 4) remains unbuilt — it's a clinical-lab partnership decision, not a code task.

---

## Recommendation Engine Scoping (pre-build, no code) — 2026-08-28

**Status: this document IS the deliverable.** No recommendation-generation code should be written against anything below until this tiering has been reviewed — that instruction came directly from the user, not something this doc is proposing on its own.

**Why this came first, ahead of the WHOOP dev account / Gemini key / Thai legal review:** the shape of this tiering determines what to ask legal to review and what WHOOP scopes to actually request. Scoping after those three would mean re-scoping.

### 0. Urgent finding surfaced while doing this inventory — not a future risk, a current one

Before the tiers: `server/services/geminiService.ts` → `server/routes/handscan.ts` → `NutritionRecommendation` is **already live in production right now**, patient-facing, and does exactly what Tier C below says should stay quarantined — it infers a deficiency ("likelyDeficiencies": nutrient + confidence + reason) from a hand photo — **and** exactly what Tier B says needs a pharmacist checkpoint — it outputs a specific supplement name + dosage (`recommendedVitamins`). It has **zero human-in-the-loop review**. `CustomVitaminConcept`/`AiOutput` — the pharmacist-reviewed workflow already built and verified this session (Accept/Modify/Reject, `reviewedById`, FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY) — sits right next to this and reviews nothing this pathway produces; it was built for a different (currently-gated) model.

This predates today's work and wasn't caught by the earlier `data/DATA_PROVENANCE.md` investigation, which scoped only the WHOOP-based prediction model. Recommend treating this as its own decision, separate from the forward-looking scoping below: **should `POST /v1/analysis/hand-scan`'s output be gated behind pharmacist review before it reaches a patient, the same way the WHOOP model was gated?** Flagging here rather than silently fixing it, since gating a live patient-facing feature is a call worth confirming first, not a unilateral one — see the open question this raises at the bottom of this entry.

### 1. Trigger inventory — every signal that could feed a recommendation

| Signal | Where it lives | Status |
|---|---|---|
| Self-reported health goals (energy/sleep/skin/etc.) | `HealthProfile.healthGoals` | In-scope |
| Self-reported dietary restrictions | `HealthProfile.dietaryRestrictions` | In-scope |
| Self-reported medical notes (freeform) | `HealthProfile.medicalNotes` | In-scope, but unstructured — not usable as a rule input until it's a structured field, which is a schema change this DB role currently can't make (see §4/§8) |
| Hand-scan visual signals (nail/palm/skin observations) | `HandScan.rawAnalysis` | In-scope as raw signal |
| Hand-scan inferred deficiencies + vitamin/dosage suggestions | `NutritionRecommendation` | **Already live, ungated — see §0 above.** Tier C + Tier B simultaneously. |
| WHOOP recovery / sleep / strain / HRV | `BiometricReading` (source: whoop) | In-scope once WHOOP is configured (currently `whoopConfigured: false` in production) |
| Hand-scan wellness score | `BiometricReading` (antioxidant_score) | In-scope |
| Self-report wellness score | `BiometricReading` (wellness_score) | In-scope |
| Self-report symptom flags (8 items) | `BiometricReading` (symptom_*) | In-scope |
| Adherence to plan | `BiometricReading` (adherence_score) | In-scope |
| Supplement sales/usage history | `Dataset` / `Product` | Quarantined for a different reason than clinical risk: `Product` has 0 rows (see the Phase 5 data-layer entry above) and this is operational/business data, not per-patient clinical data — a different risk category from everything else in this table, not comparable to Tier A/B/C |
| Lab results | Not collected anywhere | Deferred — no lab integration exists (see "More data gathering" entry above) |
| Family/medical history | Not collected anywhere | Deferred — would need real clinical involvement before collecting at all |

### 2. Risk tiers

**Tier A — safe to build now.** No clinical inference, rules/thresholds on already-collected data, always defers to a human rather than asserting a health fact:
- "You haven't checked in for N days"
- "You haven't logged a hand scan in N weeks"
- "Your WHOOP hasn't synced in N days"
- "You reported low wellness N check-ins in a row — consider a check-in with your pharmacist" (flags a pattern, names no condition, suggests talking to a licensed person — not a diagnosis)
- Adherence nudge: "You said you didn't follow your plan last time — want to review it?"
- Non-personalized general wellness content (no inference from this patient's data)

**Tier B — needs a pharmacist-in-the-loop checkpoint.** Anything suggesting a specific supplement, dose, or timing change:
- A future rules-based "based on your goals + adherence + activity level, consider X" suggestion naming a real catalog SKU
- `CustomVitaminConcept` (the existing formulation workflow) — once it has legitimate data behind it, which it currently doesn't (see the Phase 5 catalog-gap entry above)
- **`NutritionRecommendation.vitamins`** (existing, live, currently NOT routed through this checkpoint — see §0)

**Tier C — quarantined, internal-research-only, same posture as the original gated model.** Anything that infers a deficiency, condition, or health risk from data:
- **`NutritionRecommendation.likelyDeficiencies`** (existing, live, currently NOT quarantined — see §0)
- Any future "based on your symptoms, this may indicate [condition]" — not planned, named here only so it's explicitly off the table without both `prd.md` §14 gates (licensed specialist review + FDA/Thai FDA certification)
- Correlating non-adherence with worsening self-report trend to suggest a condition is "worsening" — quarantined; a trend going down is Tier A to *show* (the sparkline already does this, with no interpretation attached), but naming *why* it's happening crosses into Tier C

### 3. Tier B checkpoint spec

Reuse the existing mechanism rather than building a second one — it's already built and verified this session:
- **Who reviews:** the org's pharmacist/clinician role (today: free-form strings from seed data — `requireRole` is still unwired, see `MVP-LAUNCH-CHECKLIST.md` §1; a real role enum is a prerequisite for this, not optional once Tier B ships for real)
- **What they see:** the FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY panel (`AiInsightsDetail.tsx`), not the raw model output
- **What they can do:** Accept / Modify (with a required note — built this session) / Reject
- **What's logged:** `reviewedById` (non-spoofable, from the authenticated session) + `reviewNote` when modified — both already real

### 4. Explainability spec

A recommendation doesn't ship if it can't populate all four fields honestly:
- **Fact** — the actual observed data point (a real reading, a real self-report answer), not a summary
- **Inference** — what pattern was drawn from it, stated as inference, not fact
- **Recommendation** — the suggested action, always phrased as a suggestion for a licensed reviewer or the patient's own judgment, never a directive
- **Uncertainty** — what's missing, how much data this is based on, and (for Tier B/C) that it hasn't been clinically validated — the same honesty standard `data/DATA_PROVENANCE.md` already forced onto the old model applies to every future one

### Open questions this scoping raises (not answered here)

1. ~~Should `POST /v1/analysis/hand-scan` be gated pending pharmacist review, the same way `POST /v1/ai/predict` was?~~ — **Answered 2026-08-28: yes, gate it.** See the follow-up entry below.
2. Real role enum for `requireRole` — blocks Tier B shipping for real regardless of anything else. Still open.
3. Whether Tier A needs an LLM at all, or ships on rules/thresholds — determines whether the Gemini key is even needed for this specific feature (separate from hand-scan analysis, which already needs it). Still open.

---

## Hand-scan gate — built 2026-08-28

**Status: done, confirmed with the user before changing.** `POST /v1/analysis/hand-scan` no longer creates a patient-visible `NutritionRecommendation` directly. It now creates a pending `AiOutput` (type `hand_scan_vitamin_concept`) + `CustomVitaminConcept`, routed through the same Accept/Modify/Reject pharmacist-review pipeline already built for other insight types — not a second mechanism. `server/routes/insights.ts`'s review handler builds the real `NutritionRecommendation` only once a pharmacist accepts, from the raw analysis data preserved in `content._raw` at scan time. The overall wellness score and raw visual signals (nail/palm/skin observations) still reach the patient immediately — those are direct observations, not inferred claims; only the deficiency inference, vitamin/dosage suggestions, and meal plan wait for review.

**A required companion fix, found while wiring this, not optional polish:** every consumer self-signup landed in an org (`HYG.3 Consumer Platform`) that had **zero staff users** — meaning nothing could ever be reviewed for anyone who signed up that way, which would have made the new gate leave every hand-scan permanently stuck pending. Confirmed 54 existing patients in that org, all test artifacts from this session's own smoke tests (`smoketest+...`, `checkin+...`, etc. — checked the actual email list before touching anything). Fixed `server/routes/onboarding.ts` to route new signups into whichever org actually has staff; migrated the 54 existing rows to that org after explicit user confirmation (the environment's own safety classifier correctly held back the bulk DB update until asked directly, rather than letting a script quietly run it).

New end-to-end regression test (`server/test/smoke.test.ts`) covers the full path: scan → nothing visible to the patient → pharmacist approves → now visible, with real assertions on both the gated response shape and the org-scoped review flow. 16/16 tests passing.

**Evidence:** `server/routes/handscan.ts`, `server/routes/insights.ts`, `server/routes/onboarding.ts`, `MVP-LAUNCH-CHECKLIST.md` §1.

---

## Health trend chart + telemedicine review request — built 2026-08-28

User ask, in two parts across the same conversation: "adding Whoop data to dashboard... [pharmacist review] can be add on like telemedicine eg. request pharmacist for reviews," then "adding health chart to make user see if they get better or worst and if it under some number suggest to get advice from 'pharmacist' via telemedicine."

**Gap found:** WHOOP recovery/sleep/strain/HRV data was already being collected (`BiometricReading`, real OAuth sync per §8 of the checklist) and already displayed on the *pharmacist's* side (`PatientDetail.tsx`'s biometric summary cards). The patient's own dashboard only ever showed a WHOOP *connection* status card — never the actual numbers. Same gap for the hand-scan wellness score.

**Built:**
- `server/services/biometrics.ts` — extracted the trend-computation logic that used to live only in the authenticated pharmacist route, so a new unauthenticated patientId-scoped twin (`GET /v1/wearables/biometric-summary`) can't drift from the original.
- `src/components/HealthTrendChart.tsx` — an actual line chart (hover tooltip, trend arrow, threshold reference line), not another stat tile, per the user's explicit "chart... see if they get better or worse."
- Threshold banner: **only** for Recovery (<34%) and Sleep (<50%), WHOOP's own published bands. Deliberately no threshold for Strain or HRV — neither has a universal "low" number (HRV is highly individual), and inventing one would repeat the exact fabricated-clinical-threshold mistake `data/DATA_PROVENANCE.md` already caught and fixed once in this project. Under threshold → plain-language banner + "Request Pharmacist Review," never a diagnosis.
- `POST /v1/telemedicine/request-review` (`server/routes/telemedicine.ts`) — the "telemedicine" ask. Two triggers, one pipeline: a hand-scan request flags the *existing* pending `AiOutput` (`patientRequestedAt` in its `content` JSON); a wearable-trend request creates a new one (`type: 'telemedicine_request'`). Both go through the same `AiOutput`/`CustomVitaminConcept` review pipeline as hand-scan gating above — a third parallel mechanism was never considered. No schema change (same DB-ownership wall).
- Pharmacist queue (`GET /v1/ai/outputs`) now sorts patient-requested items first and exposes `patientRequestedAt`; `AiInsightsList`/`AiInsightsDetail` show a "Requested" badge/banner.

4 new regression tests (patient-side summary parity with the pharmacist-side one, both request-review paths, no-duplicate check on the hand-scan path); 20/20 passing. All 4 locales translated.

**Evidence:** `server/services/biometrics.ts`, `server/routes/wearables.ts`, `server/routes/telemedicine.ts`, `server/routes/insights.ts`, `src/components/HealthTrendChart.tsx`, `src/pages/Client/HandScanner.tsx`, `MVP-LAUNCH-CHECKLIST.md` §10.

---

## Fitbit integration + device-connection UX — built 2026-08-28

User ask: "give better experience of adding Whoop/Fitbit or apple watch, make sure it's able to sync." Before building, asked explicitly how far Fitbit/Apple Watch should go — three real options with genuinely different scope/cost (UI polish only; polish + real Fitbit; UI-only for all three) — rather than guessing. **Answered: WHOOP polish + real Fitbit integration.** Apple Watch stays out of scope, unchanged from §8's original finding (no cloud API without a native iOS app or a paid aggregator).

**Built Fitbit exactly like WHOOP was built — real OAuth code, honestly gated behind real credentials, unverified data-endpoint fields flagged as such, not guessed-and-presented-as-fact.** `server/services/fitbitService.ts`. One real difference worth noting: Fitbit's token exchange uses HTTP Basic-Auth with the client credentials, not body params like WHOOP — got this right by checking Fitbit's actual OAuth docs rather than assuming WHOOP's pattern transfers.

**Found and fixed a real WHOOP correctness bug while building Fitbit's sync path alongside it, not something Fitbit's arrival merely prompted a look at.** The old `/whoop/sync` swallowed every per-metric fetch failure into `null` indiscriminately — an expired/revoked WHOOP token produced `{success: true, syncedMetrics: []}`, indistinguishable from "already up to date." New `WearableAuthError` (`server/services/oauthCrypto.ts`) is thrown specifically on 401/403 and surfaces as `needsReauth: true`, which the frontend now renders as a **Reconnect** button. Same fix applied to Fitbit's sync from day one.

**Fitbit's metrics are deliberately separate metricTypes** (`fitbit_sleep_efficiency`, `fitbit_resting_hr`, `fitbit_steps`), not merged into WHOOP's `sleep_score`/`strain` — different measurements/scales, and conflating them would silently corrupt a patient's trend line on a device switch. No threshold applied to any of them on the health chart, same "no fabricated clinical cutoff" rule as Strain/HRV in the entry above — Fitbit publishes no equivalent single guidance number.

**Extracted shared OAuth-state/token-crypto code (`server/services/oauthCrypto.ts`) without changing its behavior.** One real risk caught before shipping: the encryption key is derived via scrypt from a salt string that used to read `'hyg3-whoop-token-v1'`. Renaming it to something provider-generic during the extraction would have derived a *different* key, silently making any already-encrypted WHOOP ciphertext undecryptable in production. Left the salt string as-is (still says "whoop" even though it's shared now) and verified with a direct encrypt→decrypt round-trip script across both providers' re-exports before trusting it, not just by code inspection.

**Apple Watch's UI treatment is deliberately not "Coming Soon."** It gets its own "Not Available" badge, distinct from WHOOP/Fitbit's — those two are finished code waiting on credentials; Apple Watch is still blocked on an unmade decision. Using the same badge for both would have implied a timeline that doesn't exist.

2 new regression tests (Fitbit sync 404, Fitbit connect redirects to `not_configured` honestly); 22/22 passing. Both builds clean. All 4 locales translated.

**Evidence:** `server/services/fitbitService.ts`, `server/services/oauthCrypto.ts`, `server/services/whoopService.ts`, `server/routes/wearables.ts`, `src/components/WearablesPanel.tsx`, `MVP-LAUNCH-CHECKLIST.md` §11.

---

## Telemedicine session/schedule/alert — built 2026-09-04

User ask: "adding telemedicine session, schedule and alert. Make sure according to the concept preventive health tracker."

**Scoping call, made without asking first (unlike the WHOOP/Fitbit/Apple Watch split, which genuinely had three different-cost options): the smallest version that's real, not a fabricated two-way calendar.** No pharmacist "availability" concept exists anywhere in this app — building patient-picks-a-slot-from-open-times would need a data model this DB role can't create (same ALTER-TABLE ownership wall as everything else) and no existing UI/data to build it from. Instead, the existing §10 "Request Pharmacist Review" flow becomes a real session with a state machine: requested → scheduled (pharmacist sets the date/time when accepting, mirroring how `modified` already requires a note) → completed/cancelled. Same `AiOutput.content` JSON approach as every other "field" added this session.

**"Alert," checked before building, not assumed:** grepped for nodemailer/twilio/sendgrid/any push infra — none exists in this app. So "alert" is in-app only, surfaced proactively at the top of the dashboard on load (`TelemedicineAlerts.tsx`), not an out-of-band notification. Building real push/SMS/email is a separate, larger integration decision this request didn't ask for.

**The "preventive health tracker" instruction, taken literally:** the alert surface had to be proactive, not something the patient has to go looking for. Session status (pending/scheduled) and trend alerts (reusing the *exact* threshold source the health chart already uses — factored into `server/services/healthThresholds.ts` so the two can't drift apart) now render above everything else on `ClientDashboard`, before check-ins, before the wearables panel, before the chart itself. Renders nothing when there's nothing to say, same "no fabricated urgency" rule as every other empty-state in this app. Trend alerts still cover only Recovery/Sleep/Hand-Scan Wellness — Strain/HRV/every Fitbit metric still get no threshold, same reasoning as the two entries above this one.

New end-to-end regression test covers the full lifecycle (request → pending alert → reject missing/past date → schedule → alert reflects it → complete → alert clears → can't re-complete); 23/23 passing. Both builds clean. All 4 locales translated.

**Evidence:** `server/routes/insights.ts`, `server/routes/telemedicine.ts`, `server/services/healthThresholds.ts`, `src/components/TelemedicineAlerts.tsx`, `src/pages/App/AiInsightsDetail.tsx`, `MVP-LAUNCH-CHECKLIST.md` §12.

---

## Patient-experience audit — built 2026-09-04

Asked to think as an actual patient using the app, find where it falls short, and fix what's finishable today (as opposed to what needs the user's own action — real WHOOP/Fitbit/Gemini credentials — or a decision — where the product catalog data comes from). Two real gaps found by walking the actual patient flow rather than re-reading the checklist:

**The dashboard silently erased evidence of a submitted scan.** `ClientDashboard.tsx` decided "no analysis yet" purely from whether an *approved* `NutritionRecommendation` existed. A patient who scanned and is sitting in review — the normal, expected state for most of a scan's lifetime — saw the exact same "take your first scan" empty state as someone who'd never opened the camera. Fixed with a new `GET /v1/recommendations/:patientId/pending` and a banner showing elapsed time. Deliberately **not** a promised turnaround number ("usually within 24h") — no real pharmacist-staffing SLA exists anywhere in this project to back that claim, and inventing one would be exactly the kind of unearned promise `data/DATA_PROVENANCE.md` exists to catch elsewhere. Elapsed time is honest; a made-up ETA wouldn't be.

**The patient never saw why.** The API already returned the raw hand-scan observations (`signals`) on every recommendation — pure dead data, never rendered. The pharmacist sees FACT/INFERENCE/RECOMMENDATION/UNCERTAINTY (prd.md §6.4); the patient only ever saw the RECOMMENDATION. Added a "What We Observed" section using data that already existed, shown first, same order as the pharmacist's view.

Both are small, additive, no schema change, no new external dependency — the honest distinction the user asked for ("start where can finished") from the bigger, genuinely blocked items (real credentials, a real product catalog + purchase path) discussed in the prior turn but not started.

3 new regression tests; 24/24 passing. Both builds clean. All 4 locales translated.

**Evidence:** `server/routes/recommendations.ts`, `src/pages/Client/ClientDashboard.tsx`, `src/lib/timeAgo.ts`, `MVP-LAUNCH-CHECKLIST.md` §13.

---

## Product catalog + real SKU matching — built 2026-09-04

User said "build it" after the prior turn's assessment named two paths forward: get real WHOOP/Fitbit/Gemini credentials (needs the user's own action, not code), or close the loop from recommendation to something purchasable (needs a decision on where catalog data comes from, which wasn't answered). Built the one that's actually finishable: the catalog **infrastructure**, not the catalog data itself.

**Explicitly did not fabricate a product catalog to make this look done.** `Product` has been 0 rows all session (§8's original finding), and there's no legitimate way for this session to source real, rights-cleared Thai vitamin/supplement pricing data on its own. Inventing plausible-looking products/prices to demo the feature would be exactly the kind of "looks real, isn't" the entire session's `data/DATA_PROVENANCE.md` thread exists to prevent. So: build real upload + matching + display, ship it with zero rows (same honest-empty state as before), and it does something real the instant a partner's actual inventory arrives.

**Real CSV upload** (`POST /v1/products/upload`), same shape as the sales-dataset ingestion already built in §3 — required columns, per-row validation with a real skipped-row count, no seeding. **Real matching at approval time** (`server/services/productMatch.ts`) — a pharmacist approving a hand-scan recommendation gets each suggested vitamin checked against the org's *current* catalog (name overlap, no invented match-confidence score), attached as an explicit `product: {...} | null` — never a silently-missing field, so "not in the catalog" is a real, visible state on the patient's screen rather than something the UI has to infer from absence.

**One schema workaround worth flagging:** `Product.ingredients` was a plain JSON string array; extended it (same column, same no-ALTER-TABLE constraint as everything else) to also carry `price`/`currency`/`purchaseUrl` as an object instead, with back-compatible parsing for the old plain-array shape in case anything already relied on it (nothing did — checked first).

**Explicitly not built:** an actual checkout/payment flow. `purchaseUrl` renders as a real link when a product has one, but there's no cart or order record — that's a materially bigger, separate build (a payment provider, another new table this DB role can't create) and "build it" didn't imply going that far without discussing it first.

3 new regression tests (missing-columns rejected, upload → GET reflects real parsed price, full scan→approve→match flow with both a real match and an explicit null on an unmatched vitamin); 26/26 passing. Both builds clean.

**Evidence:** `server/routes/products.ts`, `server/services/productMatch.ts`, `server/routes/insights.ts`, `src/pages/App/ProductCatalog.tsx`, `src/pages/Client/ClientDashboard.tsx`, `MVP-LAUNCH-CHECKLIST.md` §14.

---

## requireRole wired — built 2026-09-04

User asked "go lives" twice with nothing having changed in between — asked directly what to do rather than repeat the same readiness report a third time. Answered: wire `requireRole`, the one blocking item on the checklist that's pure code, no lawyer needed.

**Found a real inconsistency before touching any gate logic.** Two seed files, two different role vocabularies: `seed.ts` uses "Lead Clinician"/"Pharmacist"; `seed.js` uses the PRD's fixed enum ("org_admin"/"analyst"). Didn't guess which one matters — logged into the live backend as both `sarah@` and `marcus@libralytics.com` and read the real `role` claim back off a genuine login response. "Lead Clinician" and "Pharmacist" are what's actually live; `seed.js` was never wired into any script and had a real bug of its own (no password hash), so it was deleted rather than left around as a stale, misleading second source of truth.

**Deliberately gated to both real roles, not narrowed to one.** Every review in this app's own test suite is done as `sarah@libralytics.com` ("Lead Clinician") — narrowing the gate to "Pharmacist" alone, which might look like the more textbook-correct choice, would have silently locked her out of work she already does, which isn't a fix. The actual risk the checklist named was a role that doesn't exist yet (front-desk, IT admin) being able to approve clinical content — that's what the gate now stops, without breaking either of today's two real people.

**A real TypeScript footgun, isolated and worked around rather than routed past.** `router.post(path, requireRole(...), handler)` made TS infer a looser `Request` generic for the handler — params typed as `string | string[]`, a `.include` relation no longer recognized. Confirmed it was actually caused by this change (not pre-existing) by `git stash`-ing back to the last clean commit and re-running `tsc` clean. Fixed by moving the role check inline at the top of each handler instead of as a chained middleware argument — identical enforcement, just avoids the multi-handler generic-inference conflict.

**Frontend made consistent, not left to silently 403.** `AiInsightsDetail.tsx` now hides the review/session-management buttons for a non-reviewer role and explains why, mirroring the backend's role list (kept in sync by hand — no shared module across that boundary, same tradeoff as `healthThresholds.ts`).

**One honest limitation:** no live negative-path test exists (no user-provisioning endpoint to create a genuinely different-role account through the API), so the 403 path is verified by code review, not a live test. What is verified: the full 26-test suite still passes unchanged, confirming neither real user lost access to work they're supposed to do.

**Evidence:** `server/routes/insights.ts`, `src/pages/App/AiInsightsDetail.tsx`, `server/prisma/seed.ts`, `MVP-LAUNCH-CHECKLIST.md` §15.
