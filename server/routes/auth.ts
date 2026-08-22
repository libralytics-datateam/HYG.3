import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
const TOKEN_TTL = '12h';

// POST /v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'Server auth is not configured' });
      return;
    }

    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, orgId: user.orgId, role: user.role, email: user.email },
      secret,
      { expiresIn: TOKEN_TTL }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /v1/auth/me — return the current authenticated user
router.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
