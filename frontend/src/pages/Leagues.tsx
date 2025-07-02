import React, { useState, useEffect } from 'react';
import { Search, Trophy, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface League {
  id: number;
  name: string;
  country: string;
  type: string;
  logo?: string;
  season?: number;
}

const Leagues: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    const filtered = leagues.filter(league =>
      league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      league.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeagues(filtered);
  }, [searchTerm, leagues]);

  const fetchLeagues = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL || import.meta.env.REACT_APP_API_URL}/leagues`);
      const data = await response.json();
      
      if (data.success) {
        setLeagues(data.data || []);
      } else {
        toast.error('Failed to fetch leagues');
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      toast.error('Failed to fetch leagues');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Trophy className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Leagues</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search leagues by name or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredLeagues.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No leagues found' : 'No leagues available'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Leagues will appear here once data is loaded'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league) => (
            <div
              key={league.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                {league.logo && (
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{league.name}</h3>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{league.country}</span>
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{league.type}</p>
                  {league.season && (
                    <p className="text-sm text-gray-500">Season: {league.season}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leagues; 