import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Calendar, 
  Star, 
  TrendingUp,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { usePredictions } from '../contexts/PredictionsContext';
import PredictionCard from '../components/PredictionCard';

const Predictions: React.FC = () => {
  const { 
    predictions, 
    loading, 
    error, 
    fetchPredictions, 
    fetchTodayPredictions, 
    fetchTomorrowPredictions,
    fetchHighConfidencePredictions,
    savePrediction 
  } = usePredictions();

  const [filters, setFilters] = useState({
    league: '',
    minConfidence: '',
    maxConfidence: '',
    dateFrom: '',
    dateTo: ''
  });

  const [sortBy, setSortBy] = useState('confidence');
  const [view, setView] = useState<'today' | 'tomorrow' | 'all' | 'high-confidence'>('today');

  useEffect(() => {
    switch (view) {
      case 'today':
        fetchTodayPredictions();
        break;
      case 'tomorrow':
        fetchTomorrowPredictions();
        break;
      case 'high-confidence':
        fetchHighConfidencePredictions();
        break;
      case 'all':
        fetchPredictions(filters);
        break;
    }
  }, [view, filters, fetchTodayPredictions, fetchTomorrowPredictions, fetchHighConfidencePredictions, fetchPredictions]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrediction = async (predictionId: number) => {
    try {
      await savePrediction(predictionId);
    } catch (error) {
      console.error('Failed to save prediction:', error);
    }
  };

  const sortedPredictions = [...predictions].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence_score - a.confidence_score;
      case 'date':
        return new Date(a.match.date).getTime() - new Date(b.match.date).getTime();
      case 'home-win':
        return b.home_win_probability - a.home_win_probability;
      case 'away-win':
        return b.away_win_probability - a.away_win_probability;
      default:
        return 0;
    }
  });

  const viewOptions = [
    { key: 'today', label: 'Today', icon: Calendar },
    { key: 'tomorrow', label: 'Tomorrow', icon: Calendar },
    { key: 'high-confidence', label: 'High Confidence', icon: Star },
    { key: 'all', label: 'All Predictions', icon: TrendingUp }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Football Predictions
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered betting predictions with confidence scoring for upcoming football matches
        </p>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => setView(option.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                view === option.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {view === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                League
              </label>
              <select
                value={filters.league}
                onChange={(e) => handleFilterChange('league', e.target.value)}
                className="input"
              >
                <option value="">All Leagues</option>
                <option value="39">Premier League</option>
                <option value="140">La Liga</option>
                <option value="135">Serie A</option>
                <option value="78">Bundesliga</option>
                <option value="61">Ligue 1</option>
                <option value="2">Champions League</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Confidence
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.minConfidence}
                onChange={(e) => handleFilterChange('minConfidence', e.target.value)}
                className="input"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Confidence
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.maxConfidence}
                onChange={(e) => handleFilterChange('maxConfidence', e.target.value)}
                className="input"
                placeholder="1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Sort Options */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-auto"
          >
            <option value="confidence">Confidence</option>
            <option value="date">Date</option>
            <option value="home-win">Home Win Probability</option>
            <option value="away-win">Away Win Probability</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {loading ? 'Loading...' : `${sortedPredictions.length} predictions`}
        </div>
      </div>

      {/* Predictions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      ) : sortedPredictions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedPredictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PredictionCard 
                prediction={prediction} 
                onSave={handleSavePrediction}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No predictions available</p>
        </div>
      )}

      {/* Load More Button */}
      {view === 'all' && sortedPredictions.length > 0 && (
        <div className="text-center">
          <button className="btn btn-primary">
            Load More Predictions
          </button>
        </div>
      )}
    </div>
  );
};

export default Predictions; 