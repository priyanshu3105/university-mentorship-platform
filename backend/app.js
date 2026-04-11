import express from 'express';
import cors from 'cors';
import authRouter from './routes/authRoutes.js';
import profileRouter from './routes/profileRoutes.js';
import mentorRouter from './routes/mentorRoutes.js';
import availabilityRouter from './routes/availabilityRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import {
  rateLimiter,
  requireHttpsInProduction,
  securityHeaders,
} from './middleware/security.js';
import { getAllowedOrigins } from './config/allowedOrigins.js';

const app = express();

app.set('trust proxy', 1);
app.use(requireHttpsInProduction);
app.use(securityHeaders);
app.use(rateLimiter());
app.use(express.json({ limit: '1mb' }));

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRouter);
app.use('/api', profileRouter);
app.use('/api', mentorRouter);
app.use('/api', availabilityRouter);
app.use('/api', bookingRouter);
app.use('/api', chatRouter);
app.use('/api', reviewRouter);
app.use('/api', adminRouter);

export { app };
