import { Router } from 'express';

const router = Router();

// GATED — do not remove this check without reading data/DATA_PROVENANCE.md first.
// The underlying model is trained on a synthetic Kaggle practice dataset with a
// publicly-flagged faulty validation methodology, and the biometric->symptom
// feature mapping in server/ml/predict.py is an unvalidated invented heuristic.
// Neither has any clinical provenance. Serving this as a live prediction violates
// prd.md §13 (Vitamin Deficiency dataset is PROTOTYPE/research-only, never
// user-facing). Gated 2026-08-27 pending real, clinically-sourced training data.
router.post('/predict', async (_req, res) => {
  res.status(503).json({
    error: 'This prediction feature is disabled. The underlying model is trained on synthetic, ' +
      'non-clinical data and does not meet this platform\'s medical-grade data bar — see ' +
      'data/DATA_PROVENANCE.md for details. Re-enabling requires validated clinical training data ' +
      'and sign-off per prd.md §13.',
  });
});

export default router;
