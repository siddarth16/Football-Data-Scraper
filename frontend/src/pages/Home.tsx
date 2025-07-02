import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Shield, 
  BarChart3, 
  Globe,
  ArrowRight,
  Calendar,
  Star
} from 'lucide-react';
import { usePredictions } from '../contexts/PredictionsContext';
import PredictionCard from '../components/PredictionCard';

const Home: React.FC = () => {
  const { predictions, loading, fetchTodayPredictions } = usePredictions();

  React.useEffect(() => {
    fetchTodayPredictions();
  }, [fetchTodayPredictions]);

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning algorithms analyze team performance, historical data, and statistical patterns to generate accurate predictions.'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Multiple Betting Markets',
      description: 'Comprehensive coverage including Win/Draw/Loss, Both Teams to Score, Total Goals, and Asian Handicaps.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Real-time Updates',
      description: 'Data updates every hour with automated workflows ensuring you always have the latest information.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Confidence Scoring',
      description: 'Each prediction comes with a confidence score based on statistical analysis and historical performance.'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Historical Analysis',
      description: 'Complete team statistics, head-to-head records, and performance trends from 2020 to 2025.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Global Coverage',
      description: 'Coverage of major European leagues, international competitions, and emerging football markets.'
    }
  ];

  const leagues = [
    { name: 'Premier League', country: '🇬🇧 England', color: 'bg-blue-500' },
    { name: 'La Liga', country: '🇪🇸 Spain', color: 'bg-red-500' },
    { name: 'Serie A', country: '🇮🇹 Italy', color: 'bg-green-500' },
    { name: 'Bundesliga', country: '🇩🇪 Germany', color: 'bg-yellow-500' },
    { name: 'Ligue 1', country: '🇫🇷 France', color: 'bg-purple-500' },
    { name: 'Champions League', country: '🌍 Europe', color: 'bg-indigo-500' }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shadow">
            Football Betting Predictions
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            AI-powered predictions for football matches across major leagues worldwide. 
            Get accurate betting insights with confidence scoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/predictions"
              className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              View Predictions
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/matches"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 text-lg font-semibold"
            >
              Live Matches
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card text-center"
        >
          <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Today's Matches</h3>
          <p className="text-3xl font-bold text-primary-600">
            {loading ? '...' : predictions.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card text-center"
        >
          <Star className="w-12 h-12 text-warning-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">High Confidence</h3>
          <p className="text-3xl font-bold text-warning-600">
            {loading ? '...' : predictions.filter(p => p.confidence_score >= 0.7).length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card text-center"
        >
          <Globe className="w-12 h-12 text-success-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Leagues Covered</h3>
          <p className="text-3xl font-bold text-success-600">11</p>
        </motion.div>
      </section>

      {/* Today's Predictions Preview */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Today's Predictions</h2>
          <Link
            to="/predictions"
            className="btn btn-primary flex items-center"
          >
            View All
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : predictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.slice(0, 6).map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No predictions available for today</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why Choose Our Predictions?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-primary-600 mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Leagues */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Supported Leagues
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card flex items-center space-x-4 hover:shadow-lg transition-shadow duration-300"
            >
              <div className={`w-12 h-12 rounded-full ${league.color} flex items-center justify-center text-white font-bold`}>
                {league.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{league.name}</h3>
                <p className="text-gray-600">{league.country}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-gradient-to-r from-primary-50 to-primary-100 rounded-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our AI-powered predictions for their betting decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-primary px-8 py-3 text-lg font-semibold"
            >
              Get Started Free
            </Link>
            <Link
              to="/predictions"
              className="btn btn-secondary px-8 py-3 text-lg font-semibold"
            >
              Browse Predictions
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home; 