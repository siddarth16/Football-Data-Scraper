import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Heart, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SavedPrediction {
  id: number;
  prediction: {
    id: number;
    match: {
      home_team: { name: string };
      away_team: { name: string };
      date: string;
      league: { name: string };
    };
    predicted_winner: string;
    confidence: number;
  };
  created_at: string;
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedPredictions();
    }
  }, [user]);

  const fetchSavedPredictions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL || import.meta.env.REACT_APP_API_URL}/auth/saved-predictions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSavedPredictions(data.data || []);
      } else {
        toast.error('Failed to fetch saved predictions');
      }
    } catch (error) {
      console.error('Error fetching saved predictions:', error);
      toast.error('Failed to fetch saved predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
        <p className="text-gray-500">You need to be signed in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.email}</h1>
            <p className="text-gray-600">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Saved Predictions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Saved Predictions</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : savedPredictions.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved predictions</h3>
            <p className="text-gray-500">Start saving predictions to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPredictions.map((savedPrediction) => (
              <div
                key={savedPrediction.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {new Date(savedPrediction.prediction.match.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {savedPrediction.prediction.match.home_team.name} vs {savedPrediction.prediction.match.away_team.name}
                    </h3>
                    <p className="text-sm text-gray-600">{savedPrediction.prediction.match.league.name}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm font-medium text-blue-600">
                        Prediction: {savedPrediction.prediction.predicted_winner}
                      </span>
                      <span className="text-sm text-gray-500">
                        Confidence: {savedPrediction.prediction.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Email notifications</span>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm">
              Coming soon
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Dark mode</span>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm">
              Coming soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 