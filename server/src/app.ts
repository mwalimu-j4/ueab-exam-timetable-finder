import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app: Application = express();

// Trust proxy - required when behind Render's reverse proxy
// This allows express-rate-limit to correctly identify client IPs from X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
