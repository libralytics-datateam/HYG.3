import { Router } from 'express';
import { prisma } from '../db';
import { buildBiometricSummary } from '../services/biometrics';

const router = Router();

// GET /v1/patients — list all patients for the caller's org
router.get('/', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { createdAt: 'desc' }
    });

    const data = patients.map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      dob: p.dob,
      email: p.email,
      phone: p.phone,
      status: 'Active',
      createdAt: p.createdAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /v1/patients/:id — single patient detail
router.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params['id'] },
      include: {
        customVitaminConcepts: {
          include: { aiOutput: true },
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!patient || patient.orgId !== req.user!.orgId) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GET /v1/patients/:id/biometric-summary — aggregated view of accumulated
// biometric signal (hand scans + connected wearables). Pure data plumbing:
// real counts and trends computed from real BiometricReading rows, no
// inference/recommendation logic. This is the data layer a future
// recommendation engine (mvp-roadmap.md Phase 5) would read from — building
// it now without building any recommendation logic on top, since that part
// needs its own scoping conversation given this project's compliance history
// (see data/DATA_PROVENANCE.md, decisions.md).
router.get('/:id/biometric-summary', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params['id'] } });
    if (!patient || patient.orgId !== req.user!.orgId) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const summary = await buildBiometricSummary(patient.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error building biometric summary:', error);
    res.status(500).json({ error: 'Failed to build biometric summary' });
  }
});

export default router;
