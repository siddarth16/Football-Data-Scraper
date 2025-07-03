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

// Trust proxy for rate limiting behind Render
app.set('trust proxy', 1);

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
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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

// Test API-Football connection
app.get('/api/test-api-football', async (req, res) => {
  try {
    logger.info('Testing API-Football connection...');
    
    if (!process.env.API_FOOTBALL_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API_FOOTBALL_KEY not configured'
      });
    }
    
    // Test with a simple API call to get Premier League info
    const response = await axios.get('https://v3.football.api-sports.io/leagues?id=39&season=2024', {
      headers: {
        'x-rapidapi-key': process.env.API_FOOTBALL_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    logger.info('API-Football test successful');
    res.json({
      success: true,
      message: 'API-Football connection successful',
      data: {
        status: response.status,
        results: response.data?.results || 0,
        league: response.data?.response?.[0]?.league?.name || 'No data'
      }
    });
    
  } catch (error) {
    logger.error('API-Football test error:', error);
    res.status(500).json({
      success: false,
      error: `API-Football test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    logger.info('Checking database status...');
    
    // Check if tables exist
    const tables = ['leagues', 'teams', 'matches', 'predictions'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          tableStatus[table] = { exists: false, error: error.message };
        } else {
          tableStatus[table] = { exists: true, count: data || 0 };
        }
      } catch (err) {
        tableStatus[table] = { exists: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }
    
    res.json({
      success: true,
      database: 'Supabase',
      tables: tableStatus
    });
    
  } catch (error) {
    logger.error('Database status check error:', error);
    res.status(500).json({
      success: false,
      error: `Database status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Fetch real data from API-Football
app.post('/api/fetch-real-data', async (req, res) => {
  try {
    logger.info('Starting real data fetch from API-Football...');
    
    if (!process.env.API_FOOTBALL_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API_FOOTBALL_KEY not configured'
      });
    }
    
    // Trigger data update
    await dataService.updateAllData();
    
    logger.info('Real data fetch completed successfully');
    res.json({
      success: true,
      message: 'Real data fetched and stored successfully'
    });
    
  } catch (error) {
    logger.error('Real data fetch error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch real data: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Add sample data endpoint
app.post('/api/add-sample-data', async (req, res) => {
  try {
    logger.info('Adding sample data...');
    
    // Add sample league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: 'Premier League',
        country: 'England',
        season: 2024,
        round: 'Regular Season'
      })
      .select()
      .single();
    
    if (leagueError) {
      logger.error('League insert error:', leagueError);
      return res.status(500).json({
        success: false,
        error: `Failed to insert league: ${leagueError.message}`
      });
    }
    
    // Add sample teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .insert([
        {
          name: 'Manchester United',
          code: 'MUN',
          country: 'England',
          logo: 'https://media.api-sports.io/football/teams/33.png'
        },
        {
          name: 'Liverpool',
          code: 'LIV',
          country: 'England',
          logo: 'https://media.api-sports.io/football/teams/40.png'
        }
      ])
      .select();
    
    if (teamsError) {
      logger.error('Teams insert error:', teamsError);
      return res.status(500).json({
        success: false,
        error: `Failed to insert teams: ${teamsError.message}`
      });
    }
    
    // Add sample match
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        date: tomorrow.toISOString(),
        league_id: league.id,
        home_team_id: teams[0].id,
        away_team_id: teams[1].id,
        status: 'SCHEDULED'
      })
      .select()
      .single();
    
    if (matchError) {
      logger.error('Match insert error:', matchError);
      return res.status(500).json({
        success: false,
        error: `Failed to insert match: ${matchError.message}`
      });
    }
    
    // Add sample prediction
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .insert({
        match_id: match.id,
        home_win_probability: 0.45,
        draw_probability: 0.28,
        away_win_probability: 0.27,
        both_teams_score_probability: 0.65,
        over_2_5_goals_probability: 0.55,
        under_2_5_goals_probability: 0.45,
        home_win_or_draw_probability: 0.73,
        away_win_or_draw_probability: 0.55,
        home_handicap_1_5_probability: 0.35,
        away_handicap_1_5_probability: 0.25,
        confidence_score: 0.75,
        prediction_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (predictionError) {
      logger.error('Prediction insert error:', predictionError);
      return res.status(500).json({
        success: false,
        error: `Failed to insert prediction: ${predictionError.message}`
      });
    }
    
    logger.info('Sample data added successfully');
    res.json({
      success: true,
      message: 'Sample data added successfully',
      data: {
        league: league,
        teams: teams,
        match: match,
        prediction: prediction
      }
    });
    
  } catch (error) {
    logger.error('Sample data error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to add sample data: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
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