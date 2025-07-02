import React, { useState, useEffect } from 'react';
import { Search, Users, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Team {
  id: number;
  name: string;
  country: string;
  league_id: number;
  logo?: string;
  founded?: number;
}

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeams(filtered);
  }, [searchTerm, teams]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL || import.meta.env.REACT_APP_API_URL}/teams`);
      const data = await response.json();
      
      if (data.success) {
        setTeams(data.data || []);
      } else {
        toast.error('Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
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
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search teams by name or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No teams found' : 'No teams available'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Teams will appear here once data is loaded'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                {team.logo && (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-gray-600">{team.country}</p>
                  {team.founded && (
                    <p className="text-sm text-gray-500">Founded: {team.founded}</p>
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

export default Teams; 