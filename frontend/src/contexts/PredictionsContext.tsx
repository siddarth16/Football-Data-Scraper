import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { config } from '../config';

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

interface PredictionsContextType {
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
  fetchPredictions: (filters?: any) => Promise<void>;
  fetchTodayPredictions: () => Promise<void>;
  fetchTomorrowPredictions: () => Promise<void>;
  fetchHighConfidencePredictions: () => Promise<void>;
  savePrediction: (predictionId: number) => Promise<void>;
  savedPredictions: Prediction[];
}

const PredictionsContext = createContext<PredictionsContextType | undefined>(undefined);

export const PredictionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [savedPredictions, setSavedPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = async (filters?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }

      const response = await axios.get(`${config.apiUrl}/predictions?${params}`);
      
      if (response.data.success) {
        setPredictions(response.data.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch predictions');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch predictions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.apiUrl}/predictions/today`);
      
      if (response.data.success) {
        setPredictions(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch today\'s predictions');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch today\'s predictions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTomorrowPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.apiUrl}/predictions/tomorrow`);
      
      if (response.data.success) {
        setPredictions(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch tomorrow\'s predictions');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch tomorrow\'s predictions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighConfidencePredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.apiUrl}/predictions/high-confidence`);
      
      if (response.data.success) {
        setPredictions(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch high confidence predictions');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch high confidence predictions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const savePrediction = async (predictionId: number) => {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/save-prediction`, {
        predictionId
      });
      
      if (response.data.success) {
        toast.success('Prediction saved successfully!');
        // Refresh saved predictions
        await fetchSavedPredictions();
      } else {
        throw new Error(response.data.error || 'Failed to save prediction');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save prediction';
      toast.error(errorMessage);
    }
  };

  const fetchSavedPredictions = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/auth/saved-predictions`);
      
      if (response.data.success) {
        setSavedPredictions(response.data.data || []);
      }
    } catch (err: any) {
      // Silently fail for saved predictions
      console.error('Failed to fetch saved predictions:', err);
    }
  };

  useEffect(() => {
    // Load initial predictions
    fetchTodayPredictions();
  }, []);

  const value = {
    predictions,
    loading,
    error,
    fetchPredictions,
    fetchTodayPredictions,
    fetchTomorrowPredictions,
    fetchHighConfidencePredictions,
    savePrediction,
    savedPredictions
  };

  return (
    <PredictionsContext.Provider value={value}>
      {children}
    </PredictionsContext.Provider>
  );
};

export const usePredictions = () => {
  const context = useContext(PredictionsContext);
  if (context === undefined) {
    throw new Error('usePredictions must be used within a PredictionsProvider');
  }
  return context;
}; 