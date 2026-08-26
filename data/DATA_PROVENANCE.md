# Data Provenance & Medical-Grade Compliance Assessment

**Status: FAIL — do not use for any patient-facing prediction or health claim.**
**Assessed: 2026-08-27. Scope: the datasets pulled by `data/download_datasets.py` and the model they produced (`server/ml/vitamin_model.pkl`), which backs the (now gated) `POST /v1/ai/predict` endpoint.**

This document exists so the next person who looks at this model isn't tempted to re-enable it without understanding why it was turned off. See `server/routes/ai.ts` for the gate itself, and `prd.md` §13 for the product-level scope rule this enforces.

---

## Verdict

The data behind the vitamin-deficiency prediction model has **no clinical provenance** and does not meet any reasonable bar for "medical-grade." This is not a borderline call — the evidence is concrete and was verified directly against the raw dataset, not inferred from documentation.

## What the datasets actually are

`data/download_datasets.py` pulls four Kaggle resources plus one Kaggle kernel:

| Resource | Kaggle ID | Role |
|---|---|---|
| Vitamin Deficiency Disease Prediction Dataset | `nudratabbas/vitamin-deficiency-disease-prediction-dataset` | Trains `vitamin_model.pkl` — the model actually served |
| Pharmaceutical Drugs and Vitamins Dataset V2 | `vencerlanz09/pharmaceutical-drugs-and-vitamins-dataset-v2` | Image dataset (pill photos), unused by any served feature |
| Drugs and Vitamins Classification | `utkarshsaxenadn/drugs-and-vitamins-classification` | Image dataset, unused by any served feature |
| Supplement Sales Data | `zahidmughal2343/supplement-sales-data` | Referenced in `prd.md` §6 as in-scope operational data; not assessed here (not a clinical/prediction dataset) |
| Kaggle kernel: `faulty-valdation-set-f1-score-97` | (kernel, not a dataset) | A public notebook whose own title states the widely-cited 97% F1 score on this dataset is a validation-methodology artifact |

All findings below concern the first row — the one dataset that actually produces a served prediction.

## Evidence the training data is synthetic, not real patient data

Verified directly against the cached CSV (`vitamin_deficiency_disease_dataset_20260123.csv`, 4,000 rows, all unique):

1. **Floating-point generation artifacts.** Values like `94.98999999999998` for a lab measurement (`serum_folate_ng_ml` and similar columns) are the signature of `random.uniform()`-style procedural generation, not a real lab result. No real lab assay reports values with that kind of binary floating-point noise.
2. **No real-world source.** There is no associated clinical study, cohort, hospital, IRB approval, or patient consent process referenced anywhere in the dataset or this repo. Column names (`serum_vitamin_d_ng_ml`, `hemoglobin_g_dl`) mimic real lab panels but back nothing.
3. **A public Kaggle kernel already flags it.** The kernel `gpiosenka/faulty-valdation-set-f1-score-97` — present in this repo as `data/faulty-valdation-set-f1-score-97.ipynb` — exists specifically to document that the dataset's widely-cited 97% F1 score does not hold up under correct validation methodology.
4. **It was never actually reviewed here.** `data/data_exploration.ipynb` — the notebook that should contain exactly this kind of scrutiny — is a 0-byte empty file. This assessment is the first time anyone looked.

## A second, independent problem: the runtime feature mapping is also fabricated

Even setting the training data aside, `server/ml/predict.py` does not feed the model real symptom data. It derives the model's expected input features from WHOOP wearable scores using invented, never-validated thresholds:

```python
'has_fatigue': 1 if recovery_score < 40 else 0,
'has_muscle_weakness': 1 if recovery_score < 30 else 0,
'has_memory_problems': 1 if sleep_score < 50 else 0,
'has_pale_skin': 1 if (recovery_score < 30 and sleep_score < 50) else 0,
```

There is no clinical basis for "recovery score under 30 correlates with muscle weakness." This means a live prediction stacks two layers of fabrication: a synthetic training set, then an invented heuristic translating real wearable data into that synthetic dataset's made-up feature space. Even a perfectly-trained model on legitimate data would produce meaningless output fed through this mapping.

## What "medical-grade" would actually require

None of the following exists today. All of it would be needed before this class of feature could be re-enabled:

- Training data sourced from real patients, with documented provenance (a named clinical study, hospital partnership, or equivalent).
- Ethics/IRB approval (or the Thai equivalent) for the data collection.
- A licensing basis that explicitly permits commercial healthcare use — Kaggle dataset licenses vary and were not verified as part of this assessment; this alone would need legal review even if the data quality issue were resolved.
- Validated ground truth for the feature-engineering step (i.e., an actual clinical basis for mapping any wearable signal to a symptom flag), not an invented threshold.
- Independent clinical validation of model outputs against real diagnoses.
- The two hard gates already defined in `prd.md` §14 for anything diagnosis-adjacent: a licensed physician/specialist in the loop, and FDA/Thai FDA medical device certification.

## Current state (as of this assessment)

- `POST /v1/ai/predict` returns `503` unconditionally — see `server/routes/ai.ts`.
- `server/ml/predict.py`, `vitamin_model.pkl`, `label_encoder.pkl`, and `data/model_training.py` are left in place as research artifacts, consistent with `prd.md` §13's "internal, PROTOTYPE-labeled research only" allowance. They are not deleted; they are simply not reachable from any live route.
- No frontend code currently calls this endpoint (verified via repo search), so gating it does not remove any user-visible functionality.
- Pre-existing seeded `AiOutput` records of type `vitamin_concept` (from `server/prisma/seed.ts`) are hand-written demo data, not generated by this model, and are unaffected by this gate.

## Recommendation

Treat this as closed only when real, licensed, clinically-sourced data exists and the checklist above is satisfied — not before. Until then, this stays gated regardless of how compelling a demo re-enabling it might make.

---

## Path forward: building a legitimate first-party dataset instead

Rather than reach for another public dataset with the same class of problem, the plan is to accumulate real signal from the product's own human-in-the-loop review process — the mechanism already required by `prd.md` §6.4 for a different reason (auditability) turns out to double as the correct foundation for future model work.

**The mechanism.** Every AI-generated insight is stored as an `AiOutput` with `reviewStatus: pending`. A licensed reviewer (pharmacist/clinician per the org's role setup) then accepts, modifies, or rejects it (`server/routes/insights.ts`, `POST /v1/ai/outputs/:id/review`), and that decision — plus `reviewedById`, a real accountable person, not a spoofable client value — is recorded. That accept/modify/reject decision *is* a labeled ground-truth example: a licensed human's real judgment on a real case, not a synthetic label generated to fit a training script. This is categorically different from the Kaggle dataset assessed above, in the one way that actually matters: provenance.

**What accumulates as real patients use the product**, all already captured by the existing schema (no new tables needed, so nothing here is blocked by the `hyg3_app` `CREATE`-privilege limitation noted elsewhere):
- `HealthProfile` — real self-reported health data at onboarding
- `HandScan` + its AI analysis — real image, real (or Gemini-simulated, see `services/geminiService.ts`) analysis
- `BiometricReading` — real wearable/manual biometric data over time
- `AiOutput.reviewStatus` + `reviewedById` — the real labeled outcome

**Where to track this.** `GET /v1/stats/data-readiness` (`server/routes/stats.ts`) exposes real counts of all of the above, broken down by what the AI predicted, so category coverage is visible — not just a raw total. The admin dashboard's **Models** page (`src/pages/App/Models.tsx`) surfaces this live instead of any placeholder metric.

**What volume does *not* solve on its own.** Reaching a reviewed-case count (`READINESS_FLOOR` in `Models.tsx`, currently 200/category, arbitrary and conservative — treat as a floor, not a target) does not by itself make retraining appropriate. Still required, regardless of volume:
1. **Explicit, separate patient consent** for their data to be used in model training/research — distinct from consent to use the service itself. PDPA purpose-limitation (`prd.md` §10) means consent for "get a hand-scan analysis" does not imply consent for "train a model on my data." This consent flow does not exist yet and needs legal review before it's built, not after.
2. **Clinical validation** of any resulting model against real diagnoses, not just internal review-acceptance rate (a high acceptance rate could mean the model is good, or could mean reviewers are rubber-stamping — these need to be distinguished).
3. **The same two gates as everything else clinically-adjacent** in `prd.md` §14: a licensed specialist in the loop, and FDA/Thai FDA certification before anything diagnostic reaches a patient.

In short: this plan describes how to earn the *right kind* of data over time. It does not shortcut the regulatory and clinical requirements — it's the prerequisite that makes pursuing them worthwhile.
