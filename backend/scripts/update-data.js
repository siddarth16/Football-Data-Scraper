const { DataService } = require('../dist/services/DataService');
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
  defaultMeta: { service: 'data-updater' },
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

// Initialize services
const dataService = new DataService(supabase, logger);
const predictionService = new PredictionService(supabase, logger);

async function updateData() {
  try {
    logger.info('Starting data update process...');
    
    // Update all football data
    await dataService.updateAllData();
    
    // Generate new predictions
    await predictionService.generatePredictions();
    
    logger.info('Data update process completed successfully');
  } catch (error) {
    logger.error('Data update process failed:', error);
    process.exit(1);
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateData();
}

module.exports = { updateData }; 