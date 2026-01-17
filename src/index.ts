// backend/src/index.ts
// Entry point - CORRECTED: Imports from error.middleware (not errorHandler)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Import Stripe webhook handler and additional routes so the dev entrypoint (src/index.ts)
// behaves like src/server.ts used elsewhere. The dev script runs src/index.ts.
import { stripeWebhookHandler } from './controllers/stripeWebhook.controller';
import authRoutes from './routes/auth.routes';
import songsRoutes from './routes/songs.routes';
import progressRoutes from './routes/progress.routes';
import vocabularyRoutes from './routes/vocabulary_routes';
import achievementsRoutes from './routes/achievements.routes';
import paymentsRoutes from './routes/payments.routes';
import premiumRoutes from './routes/premium.routes';
import subscriptionRoutes from './routes/subscription.routes';
import discoverRoutes from './routes/discover.routes';

// Import middleware - CORRECTED PATH
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
// Default backend port is 3000 in this workspace
const PORT = process.env.PORT || 3000;

// Trust proxy when running behind a proxy (e.g., Railway, Vercel) so secure cookies work
app.set('trust proxy', true);

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://singuage.com',
  'https://www.singuage.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Parse cookies so controllers can read HttpOnly refresh token cookie
app.use(cookieParser());

// Important: register Stripe webhook route BEFORE express.json so the raw body is available
// for signature verification. This matches the behavior in server.ts.
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Body parsers for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/achievements', achievementsRoutes);
// Mount payments, premium and subscription routes under /api
app.use('/api', paymentsRoutes);
app.use('/api', premiumRoutes);
app.use('/api', subscriptionRoutes);
// Discover endpoint (public) - dev entrypoint
app.use('/api/discover', discoverRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;