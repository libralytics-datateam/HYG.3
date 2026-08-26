import { Router } from 'express';

const router = Router();

// POST /v1/contact — marketing site contact form submission.
// TODO: persist via prisma.contactMessage once the DB role has CREATE
// privilege to add the ContactMessage table (see schema.prisma) — the
// `hyg3_app` Supabase role currently can't create new tables, only
// read/write existing ones. Logging server-side in the meantime so
// submissions aren't silently dropped.
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: 'name, email, and message are required' });
    return;
  }

  console.log('[contact] New message:', { name, email, message, at: new Date().toISOString() });

  res.status(201).json({ success: true });
});

export default router;
