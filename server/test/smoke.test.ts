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
