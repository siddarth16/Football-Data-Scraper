const { PredictionService } = require('../dist/services/PredictionService');
const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'prediction-generator' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize prediction service
const predictionService = new PredictionService(supabase, logger);

async function generatePredictions() {
  try {
    logger.info('Starting prediction generation process...');
    
    // Generate new predictions
    await predictionService.generatePredictions();
    
    logger.info('Prediction generation process completed successfully');
  } catch (error) {
    logger.error('Prediction generation process failed:', error);
    process.exit(1);
  }
}

// Run the generation if this script is executed directly
if (require.main === module) {
  generatePredictions();
}

module.exports = { generatePredictions }; 