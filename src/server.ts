// backend/src/server.ts
// CORRECTED: Imports using underscore naming convention

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { csrfProtection } from './middleware/csrf.middleware';
import { isProduction } from './config/env';

// Import Stripe webhook handler
import { stripeWebhookHandler } from './controllers/stripeWebhook.controller';

// Import routes
import authRoutes from './routes/auth.routes';
import songsRoutes from './routes/songs.routes';
import progressRoutes from './routes/progress.routes';
import vocabularyRoutes from './routes/vocabulary_routes';
import achievementsRoutes from './routes/achievements.routes';
import paymentsRoutes from './routes/payments.routes';
import premiumRoutes from './routes/premium.routes';
import subscriptionRoutes from './routes/subscription.routes';
import discoverRoutes from './routes/discover.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// If running behind a proxy (e.g., Heroku, Vercel), trust the proxy for secure cookies and TLS
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(morgan('dev'));

// Redirect HTTP to HTTPS in production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }
    // Redirect to https
    const host = req.headers.host || '';
    return res.redirect(301, `https://${host}${req.url}`);
  });
}

// Important: Stripe requires the raw request body to verify webhook signatures.
// We register the webhook route BEFORE the global JSON body parser and use
// express.raw({ type: 'application/json' }) so the raw buffer is available to
// Stripe's signature verification. All other routes may use express.json.
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Provide CSRF token endpoint for SPA forms. This will set the csrf cookie and return the token.
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

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
// Mount payment routes under /api so the full path becomes /api/create-checkout-session
app.use('/api', paymentsRoutes);
// Mount premium demo routes
app.use('/api', premiumRoutes);
// Mount subscription management routes (cancel, billing portal)
app.use('/api', subscriptionRoutes);
// Discover endpoint (public)
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