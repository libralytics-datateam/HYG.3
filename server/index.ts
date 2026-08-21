import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai';
import insightsRoutes from './routes/insights';
import patientsRoutes from './routes/patients';
import datasetsRoutes from './routes/datasets';
import statsRoutes from './routes/stats';
import productsRoutes from './routes/products';
import onboardingRoutes from './routes/onboarding';
import handscanRoutes from './routes/handscan';
import recommendationsRoutes from './routes/recommendations';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// Allow large base64 images (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Admin / B2B routes
app.use('/v1/ai', aiRoutes);
app.use('/v1/ai/outputs', insightsRoutes);
app.use('/v1/patients', patientsRoutes);
app.use('/v1/datasets', datasetsRoutes);
app.use('/v1/stats', statsRoutes);
app.use('/v1/products', productsRoutes);

// Consumer / Phase 1 routes
app.use('/v1/onboard', onboardingRoutes);
app.use('/v1/analysis', handscanRoutes);
app.use('/v1/recommendations', recommendationsRoutes);

app.listen(port, () => {
  const geminiStatus = process.env.GEMINI_API_KEY ? '✅ Gemini Vision active' : '⚠️  No GEMINI_API_KEY — using simulated analysis';
  console.log(`Server listening on port ${port}`);
  console.log(geminiStatus);
});
