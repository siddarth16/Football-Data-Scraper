import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Prediction {
  id: number;
  match_id: number;
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  both_teams_score_probability: number;
  over_2_5_goals_probability: number;
  under_2_5_goals_probability: number;
  home_win_or_draw_probability: number;
  away_win_or_draw_probability: number;
  home_handicap_1_5_probability: number;
  away_handicap_1_5_probability: number;
  confidence_score: number;
  prediction_date: string;
  match: {
    id: number;
    date: string;
    home_team: {
      id: number;
      name: string;
      logo: string;
    };
    away_team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

interface PredictionCardProps {
  prediction: Prediction;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  const getPredictedWinner = () => {
    const { home_win_probability, draw_probability, away_win_probability } = prediction;
    const max = Math.max(home_win_probability, draw_probability, away_win_probability);
    
    if (max === home_win_probability) return prediction.match.home_team.name;
    if (max === away_win_probability) return prediction.match.away_team.name;
    return 'Draw';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {formatDate(prediction.match.date)}
            </span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence_score)}`}>
            {Math.round(prediction.confidence_score * 100)}% confidence
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-3">
          {prediction.match.league.logo && (
            <img
              src={prediction.match.league.logo}
              alt={prediction.match.league.name}
              className="h-4 w-4 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700">
            {prediction.match.league.name}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            {prediction.match.home_team.logo && (
              <img
                src={prediction.match.home_team.logo}
                alt={prediction.match.home_team.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <span className="font-medium text-gray-900 truncate">
              {prediction.match.home_team.name}
            </span>
          </div>
          
          <div className="text-center mx-4">
            <div className="text-xs text-gray-500 mb-1">VS</div>
            <div className="text-xs text-gray-400">Match</div>
          </div>
          
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <span className="font-medium text-gray-900 truncate">
              {prediction.match.away_team.name}
            </span>
            {prediction.match.away_team.logo && (
              <img
                src={prediction.match.away_team.logo}
                alt={prediction.match.away_team.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Prediction */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Prediction</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-gray-900">
              {getPredictedWinner()}
            </span>
          </div>
        </div>

        {/* Probabilities */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-gray-700">Home</div>
            <div className="text-gray-900">{Math.round(prediction.home_win_probability * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-700">Draw</div>
            <div className="text-gray-900">{Math.round(prediction.draw_probability * 100)}%</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-700">Away</div>
            <div className="text-gray-900">{Math.round(prediction.away_win_probability * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Link
            to={`/matches/${prediction.match.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Match Details
          </Link>
          <button
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Save prediction"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PredictionCard; 