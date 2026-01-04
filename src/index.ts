// backend/src/index.ts
// Entry point - CORRECTED: Imports from error.middleware (not errorHandler)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import songsRoutes from './routes/songs.routes';
import progressRoutes from './routes/progress.routes';
import vocabularyRoutes from './routes/vocabulary_routes';

// Import middleware - CORRECTED PATH
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
// Default backend port is 3000 in this workspace
const PORT = process.env.PORT || 3000;

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