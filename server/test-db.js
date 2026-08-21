const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.patient.findFirst()
  .then(r => { console.log('DB OK:', JSON.stringify(r)); return p.$disconnect(); })
  .catch(e => { console.error('DB ERR:', e.message); process.exit(1); });
