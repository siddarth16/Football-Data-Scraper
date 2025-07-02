import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import winston from 'winston';

// Import routes
import predictionsRoutes from './routes/predictions';
import matchesRoutes from './routes/matches';
import teamsRoutes from './routes/teams';
import leaguesRoutes from './routes/leagues';
import authRoutes from './routes/auth';

// Import services
import { DataService } from './services/DataService';
import { PredictionService } from './services/PredictionService';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'football-predictions-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize services
const dataService = new DataService(supabase, logger);
const predictionService = new PredictionService(supabase, logger);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://football-frontend-2uyc.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'football-predictions-api'
  });
});

// API routes
app.use('/api/predictions', predictionsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Scheduled tasks
const scheduleDataUpdates = () => {
  // Update data every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting scheduled data update');
    try {
      await dataService.updateAllData();
      logger.info('Scheduled data update completed');
    } catch (error) {
      logger.error('Scheduled data update failed:', error);
    }
  });

  // Generate predictions every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    logger.info('Starting scheduled prediction generation');
    try {
      await predictionService.generatePredictions();
      logger.info('Scheduled prediction generation completed');
    } catch (error) {
      logger.error('Scheduled prediction generation failed:', error);
    }
  });
};

// Start server
const startServer = async () => {
  try {
    // Initialize database and services
    await dataService.initialize();
    await predictionService.initialize();
    
    // Start scheduled tasks
    scheduleDataUpdates();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export { app, logger }; 