import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// POST /v1/onboard — create patient + health profile in one call
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      age,
      gender,
      heightCm,
      weightKg,
      healthGoals = [],
      dietaryRestrictions = [],
      medicalNotes = '',
      pdpaConsent = false,
    } = req.body;

    if (!firstName || !lastName || !email || !age || !gender) {
      res.status(400).json({ error: 'firstName, lastName, email, age, and gender are required' });
      return;
    }

    // pdpaConsentStatus used to be hardcoded to true unconditionally here —
    // meaning the DB recorded "explicit consent" was given on every signup
    // regardless of whether the frontend even showed a consent checkbox (it
    // didn't). Now genuinely required: the frontend sends pdpaConsent only
    // when the user actually checked the box (src/pages/Client/Onboarding.tsx).
    if (!pdpaConsent) {
      res.status(400).json({ error: 'PDPA consent is required to create a profile' });
      return;
    }

    // Route new signups into an org that actually has staff. This used to
    // always go into a separate 'consumer'-type org — found while wiring
    // hand-scan's pharmacist-review gate (2026-08-28) that that org had
    // ZERO users, so nobody could ever review anything for anyone who
    // signed up through it (confirmed: 54 real patients already stuck this
    // way). org.type isn't checked anywhere else in the codebase for
    // behavior, so there's no downside to preferring a staffed org here.
    let org = await prisma.organization.findFirst({ where: { users: { some: {} } } });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'HYG.3 Consumer Platform', type: 'consumer' }
      });
    }

    // Check for existing patient
    const existing = await prisma.patient.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        error: 'Email already registered',
        patientId: existing.id
      });
      return;
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        orgId: org.id,
        firstName,
        lastName,
        email,
        pdpaConsentStatus: true,
        consentTimestamp: new Date(),
      }
    });

    // Create health profile
    const profile = await prisma.healthProfile.create({
      data: {
        patientId: patient.id,
        age: Number(age),
        gender,
        heightCm: Number(heightCm) || 0,
        weightKg: Number(weightKg) || 0,
        healthGoals: JSON.stringify(healthGoals),
        dietaryRestrictions: JSON.stringify(dietaryRestrictions),
        medicalNotes: medicalNotes || null,
      }
    });

    res.status(201).json({
      success: true,
      data: {
        patientId: patient.id,
        profileId: profile.id,
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// GET /v1/onboard/:patientId — fetch patient profile
router.get('/:patientId', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params['patientId'] },
      include: {
        healthProfile: true,
        nutritionRecommendations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

export default router;
