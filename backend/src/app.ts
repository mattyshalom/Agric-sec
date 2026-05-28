import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { notFound } from './middleware/notFound';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import farmRoutes from './modules/farms/farm.routes';
import cropRoutes from './modules/crops/crop.routes';
import weatherRoutes from './modules/weather/weather.routes';
import marketRoutes from './modules/market/market.routes';
import pestRoutes from './modules/pest/pest.routes';
import resourceRoutes from './modules/resources/resource.routes';
import financeRoutes from './modules/finance/finance.routes';
import communityRoutes from './modules/community/community.routes';

const app = express();

// ─── Security ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Rate Limiting ───────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth routes get stricter limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, try again later.' },
});

// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Static Files ────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Logging ─────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────
const API = process.env.API_PREFIX || '/api/v1';

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/farms`, farmRoutes);
app.use(`${API}/farms`, cropRoutes);      // nested: /farms/:farmId/crops
app.use(`${API}/weather`, weatherRoutes);
app.use(`${API}/market`, marketRoutes);
app.use(`${API}/pest`, pestRoutes);
app.use(`${API}/resources`, resourceRoutes);
app.use(`${API}/finance`, financeRoutes);
app.use(`${API}/community`, communityRoutes);

// ─── Error Handling ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
