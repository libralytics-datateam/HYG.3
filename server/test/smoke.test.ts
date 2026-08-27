// Basic API smoke tests. Deliberately minimal (per
// MVP-LAUNCH-CHECKLIST.md's "at least a couple of smoke tests" ask, not a
// full test suite) and deliberately zero-new-dependency — uses Node's
// built-in test runner and global fetch, run via `tsx --test`.
//
// These start the real server as a child process against whatever
// server/.env points at, so they need a reachable DATABASE_URL to pass
// (the onboard test writes a real row). Run with `npm test`.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';

const PORT = 3999; // distinct from the dev-server default to avoid collisions
const BASE_URL = `http://localhost:${PORT}`;
let server: ChildProcess;

before(async () => {
  // Spawn tsx's CLI directly via `node`, rather than through npx/shell —
  // nesting tsx inside a shell:true child on Windows breaks esbuild's
  // internal sync worker ("spawn UNKNOWN"). --env-file is a native Node
  // flag (20+), so this doesn't need tsx's own env-file handling either.
  const tsxCli = path.join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');
  server = spawn(process.execPath, ['--env-file=.env', tsxCli, 'index.ts'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });
  server.stdout?.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr?.on('data', (d) => process.stderr.write(`[server] ${d}`));

  // Poll /v1/health until the server is actually up, instead of a fixed sleep.
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/v1/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Server did not become healthy within 20s');
});

after(() => {
  server?.kill();
});

test('GET /v1/health returns ok', async () => {
  const res = await fetch(`${BASE_URL}/v1/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'ok');
});

test('POST /v1/ai/predict stays gated (503) — regression guard', async () => {
  // This is intentionally a regression test: the model behind this endpoint
  // was found to have no clinical provenance (data/DATA_PROVENANCE.md) and
  // was deliberately gated. If this test starts failing because someone
  // re-enabled the endpoint, that's a signal to check it was a deliberate,
  // reviewed decision — not an accidental regression.
  // Needs a valid token: requireAuth runs before this route, so an
  // unauthenticated call would correctly 401 before ever reaching the gate.
  const loginRes = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah@libralytics.com', password: 'password123' }),
  });
  const { data } = await loginRes.json();

  const res = await fetch(`${BASE_URL}/v1/ai/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
    body: JSON.stringify({ patientId: 'x', age: 30, heartRate: 70 }),
  });
  assert.equal(res.status, 503);
});

test('POST /v1/onboard creates a patient with valid data', async () => {
  const uniqueEmail = `smoketest+${Date.now()}@example.com`;
  const res = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Smoke',
      lastName: 'Test',
      email: uniqueEmail,
      age: 30,
      gender: 'other',
      heightCm: 170,
      weightKg: 65,
      healthGoals: ['energy'],
      dietaryRestrictions: [],
      pdpaConsent: true,
    }),
  });
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.patientId, 'expected a patientId in the response');
  assert.equal(json.data.email, uniqueEmail);
});

test('POST /v1/onboard rejects submissions without PDPA consent', async () => {
  // Regression guard: pdpaConsentStatus used to be hardcoded true regardless
  // of user action. Make sure a request that never sets pdpaConsent is
  // rejected, not silently recorded as consented.
  const res = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'No',
      lastName: 'Consent',
      email: `noconsent+${Date.now()}@example.com`,
      age: 30,
      gender: 'other',
      heightCm: 170,
      weightKg: 65,
    }),
  });
  assert.equal(res.status, 400);
});

test('POST /v1/onboard rejects missing required fields', async () => {
  const res = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'Incomplete' }),
  });
  assert.equal(res.status, 400);
});

test('protected routes reject requests with no token', async () => {
  const res = await fetch(`${BASE_URL}/v1/patients`);
  assert.equal(res.status, 401);
});

test('POST /v1/ai/outputs/:id/review rejects "modified" without a note', async () => {
  // Validation runs before the insight lookup, so a fake id is fine here —
  // this only tests that a note is actually required for "modified", not
  // that a specific insight gets updated correctly.
  const loginRes = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah@libralytics.com', password: 'password123' }),
  });
  const { data } = await loginRes.json();

  const res = await fetch(`${BASE_URL}/v1/ai/outputs/nonexistent-id/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
    body: JSON.stringify({ status: 'modified' }),
  });
  assert.equal(res.status, 400);
});

test('hand scan writes a BiometricReading, and biometric-summary reflects it', async () => {
  const loginRes = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah@libralytics.com', password: 'password123' }),
  });
  const { data: session } = await loginRes.json();

  // Use a seeded patient (same org as sarah) rather than /v1/onboard, which
  // always creates patients under a different ('HYG.3 Consumer Platform')
  // org that sarah's session can't see — org-scoping is correct, but this
  // test needs a same-org patient to exercise the real positive path.
  const patientsRes = await fetch(`${BASE_URL}/v1/patients`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const { data: patients } = await patientsRes.json();
  const patientId = patients[0].id;

  const before = await fetch(`${BASE_URL}/v1/patients/${patientId}/biometric-summary`, {
    headers: { Authorization: `Bearer ${session.token}` },
  }).then((r) => r.json());
  const readingsBefore = before.data.totalReadings;

  // No imageBase64 + no GEMINI_API_KEY in this env → simulated analysis path
  // (overallScore: 72, per geminiService.ts's getSimulatedAnalysis), which
  // still exercises the real BiometricReading write in handscan.ts.
  const scanRes = await fetch(`${BASE_URL}/v1/analysis/hand-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId }),
  });
  assert.equal(scanRes.status, 200);

  const after = await fetch(`${BASE_URL}/v1/patients/${patientId}/biometric-summary`, {
    headers: { Authorization: `Bearer ${session.token}` },
  }).then((r) => r.json());
  assert.equal(after.data.totalReadings, readingsBefore + 1);
  const antioxidant = after.data.metrics.find((m: any) => m.metricType === 'antioxidant_score');
  assert.ok(antioxidant, 'expected an antioxidant_score metric after a hand scan');
  assert.equal(antioxidant.latestValue, 72);
  assert.equal(antioxidant.latestSource, 'hand_scanner');
});

test('hand-scan output is gated — no recommendation until a pharmacist approves it', async () => {
  // Regression guard for the 2026-08-28 gating change: hand-scan used to
  // create a patient-visible NutritionRecommendation directly, with no
  // review. This confirms the whole pipeline: scan -> pending AiOutput ->
  // nothing visible to the patient yet -> pharmacist approves -> now visible.
  const onboardRes = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Gate', lastName: 'Test', email: `gatetest+${Date.now()}@example.com`,
      age: 30, gender: 'other', heightCm: 170, weightKg: 65, pdpaConsent: true,
    }),
  });
  const { data: patient } = await onboardRes.json();

  const scanRes = await fetch(`${BASE_URL}/v1/analysis/hand-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: patient.patientId }),
  });
  const scanJson = await scanRes.json();
  assert.equal(scanRes.status, 200);
  assert.equal(scanJson.data.reviewStatus, 'pending');
  // The gate: deficiencies/vitamins/foods/mealPlan must NOT come back in
  // this response — that's the whole point of the change.
  assert.equal(scanJson.data.deficiencies, undefined);
  assert.equal(scanJson.data.vitamins, undefined);
  assert.equal(scanJson.data.mealPlan, undefined);
  // Raw signals and the overall score are direct observations, not
  // inferred health claims, so they still reach the patient immediately.
  assert.ok(Array.isArray(scanJson.data.signals));
  assert.equal(typeof scanJson.data.overallScore, 'number');

  // Nothing visible to the patient yet — no NutritionRecommendation exists.
  const beforeReview = await fetch(`${BASE_URL}/v1/recommendations/${patient.patientId}/latest`).then((r) => r.json());
  assert.equal(beforeReview.data, null);

  // Find and approve the pending insight as the pharmacist.
  const loginRes = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah@libralytics.com', password: 'password123' }),
  });
  const { data: session } = await loginRes.json();

  const outputsRes = await fetch(`${BASE_URL}/v1/ai/outputs`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const { data: outputs } = await outputsRes.json();
  const pendingOutput = outputs.find((o: any) => o.patientId === patient.patientId && o.type === 'hand_scan_vitamin_concept');
  assert.ok(pendingOutput, 'expected a pending hand_scan_vitamin_concept insight for this patient');

  const reviewRes = await fetch(`${BASE_URL}/v1/ai/outputs/${pendingOutput.id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ status: 'accepted' }),
  });
  assert.equal(reviewRes.status, 200);

  // Now it's visible.
  const afterReview = await fetch(`${BASE_URL}/v1/recommendations/${patient.patientId}/latest`).then((r) => r.json());
  assert.ok(afterReview.data, 'expected a NutritionRecommendation to exist now');
  assert.equal(afterReview.data.source, 'hand_scan');
  assert.ok(afterReview.data.vitamins.length > 0);
});

test('POST /v1/checkins saves a real check-in and GET .../latest reflects it', async () => {
  const onboardRes = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'CheckIn', lastName: 'Test', email: `checkin+${Date.now()}@example.com`,
      age: 30, gender: 'other', heightCm: 170, weightKg: 65, pdpaConsent: true,
    }),
  });
  const { data: patient } = await onboardRes.json();

  const before = await fetch(`${BASE_URL}/v1/checkins/${patient.patientId}/latest`).then((r) => r.json());
  assert.equal(before.data, null);

  const submitRes = await fetch(`${BASE_URL}/v1/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: patient.patientId, wellnessScore: 3, symptoms: ['fatigue', 'poor_sleep'] }),
  });
  assert.equal(submitRes.status, 201);

  const after = await fetch(`${BASE_URL}/v1/checkins/${patient.patientId}/latest`).then((r) => r.json());
  assert.equal(after.data.wellnessScore, 3);
  assert.deepEqual([...after.data.symptoms].sort(), ['fatigue', 'poor_sleep']);
});

test('GET /v1/checkins/:patientId/history returns wellness_score readings oldest-to-newest', async () => {
  const onboardRes = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'History', lastName: 'Test', email: `history+${Date.now()}@example.com`,
      age: 30, gender: 'other', heightCm: 170, weightKg: 65, pdpaConsent: true,
    }),
  });
  const { data: patient } = await onboardRes.json();

  for (const score of [2, 4]) {
    await fetch(`${BASE_URL}/v1/checkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.patientId, wellnessScore: score, symptoms: [] }),
    });
  }

  const res = await fetch(`${BASE_URL}/v1/checkins/${patient.patientId}/history`);
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.data.history.length, 2);
  assert.equal(json.data.history[0].value, 2);
  assert.equal(json.data.history[1].value, 4);
});

test('POST /v1/checkins accepts adherence and GET .../latest reflects it', async () => {
  const onboardRes = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Adherence', lastName: 'Test', email: `adherence+${Date.now()}@example.com`,
      age: 30, gender: 'other', heightCm: 170, weightKg: 65, pdpaConsent: true,
    }),
  });
  const { data: patient } = await onboardRes.json();

  const res = await fetch(`${BASE_URL}/v1/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: patient.patientId, wellnessScore: 4, symptoms: [], adherence: 'partial' }),
  });
  assert.equal(res.status, 201);

  const latest = await fetch(`${BASE_URL}/v1/checkins/${patient.patientId}/latest`).then((r) => r.json());
  assert.equal(latest.data.adherence, 'partial');
});

test('POST /v1/checkins rejects an invalid adherence value', async () => {
  const res = await fetch(`${BASE_URL}/v1/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: 'whatever', wellnessScore: 3, symptoms: [], adherence: 'sometimes' }),
  });
  assert.equal(res.status, 400);
});

test('POST /v1/checkins rejects an out-of-range wellnessScore', async () => {
  const res = await fetch(`${BASE_URL}/v1/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: 'whatever', wellnessScore: 9, symptoms: [] }),
  });
  assert.equal(res.status, 400);
});

test('GET /v1/wearables/status requires patientId', async () => {
  const res = await fetch(`${BASE_URL}/v1/wearables/status`);
  assert.equal(res.status, 400);
});

test('GET /v1/wearables/status reports whoopConfigured honestly when no WHOOP credentials are set', async () => {
  // Regression guard: this env has no WHOOP_CLIENT_ID/SECRET set, so the
  // endpoint must say so rather than pretending the integration is live.
  const onboardRes = await fetch(`${BASE_URL}/v1/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Wearable', lastName: 'Test', email: `wearable+${Date.now()}@example.com`,
      age: 30, gender: 'other', heightCm: 170, weightKg: 65, pdpaConsent: true,
    }),
  });
  const { data } = await onboardRes.json();

  const res = await fetch(`${BASE_URL}/v1/wearables/status?patientId=${data.patientId}`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.whoopConfigured, false);
  assert.equal(json.data.connected, false);
});
