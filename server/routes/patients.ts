import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /v1/patients — list all patients for the org
router.get('/', async (_req, res) => {
  try {
    const patients = await prisma.patient.findMany({
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
