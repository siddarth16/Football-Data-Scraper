import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import winston from 'winston';
import moment from 'moment';
import { 
  League, 
  Team, 
  Match, 
  MatchStatistics, 
  SUPPORTED_LEAGUES,
  LeagueConfig 
} from '../types';

export class DataService {
  private supabase: SupabaseClient;
  private logger: winston.Logger;
  private apiKey: string;
  private baseUrl = 'https://v3.football.api-sports.io';

  constructor(supabase: SupabaseClient, logger: winston.Logger) {
    this.supabase = supabase;
    this.logger = logger;
    this.apiKey = process.env.API_FOOTBALL_KEY || '';
    
    if (!this.apiKey) {
      this.logger.error('API Football key not found in environment variables');
    }
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing DataService...');
    
    try {
      // Create tables if they don't exist
      await this.createTables();
      
      // Initial data fetch for all leagues
      await this.updateAllData();
      
      this.logger.info('DataService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize DataService:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // This would typically be done with Supabase migrations
    // For now, we'll assume tables exist
    this.logger.info('Tables should be created via Supabase migrations');
  }

  async updateAllData(): Promise<void> {
    this.logger.info('Starting full data update...');
    
    try {
      for (const league of SUPPORTED_LEAGUES) {
        if (league.active) {
          await this.updateLeagueData(league);
          // Add delay to respect API rate limits
          await this.delay(1000);
        }
      }
      
      this.logger.info('Full data update completed');
    } catch (error) {
      this.logger.error('Failed to update all data:', error);
      throw error;
    }
  }

  async updateLeagueData(league: LeagueConfig): Promise<void> {
    this.logger.info(`Updating data for ${league.name}...`);
    
    try {
      // Get current season
      const currentSeason = new Date().getFullYear();
      
      // Update league info
      await this.updateLeagueInfo(league, currentSeason);
      
      // Update teams
      await this.updateTeams(league.apiId, currentSeason);
      
      // Update matches (last 30 days and next 30 days)
      const fromDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const toDate = moment().add(30, 'days').format('YYYY-MM-DD');
      await this.updateMatches(league.apiId, currentSeason, fromDate, toDate);
      
      this.logger.info(`Data update completed for ${league.name}`);
    } catch (error) {
      this.logger.error(`Failed to update data for ${league.name}:`, error);
    }
  }

  private async updateLeagueInfo(league: LeagueConfig, season: number): Promise<void> {
    try {
      const response = await this.makeApiRequest(`/leagues?id=${league.apiId}&season=${season}`);
      
      if (response.data && response.data.length > 0) {
        const leagueData = response.data[0];
        
        const leagueInfo: Partial<League> = {
          name: leagueData.league.name,
          country: leagueData.country.name,
          logo: leagueData.league.logo,
          flag: leagueData.country.flag,
          season: season,
          round: leagueData.seasons[0]?.round || 'Regular Season'
        };

        // Upsert league data
        const { error } = await this.supabase
          .from('leagues')
          .upsert([leagueInfo], { onConflict: 'id' });

        if (error) {
          this.logger.error(`Failed to upsert league ${league.name}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update league info for ${league.name}:`, error);
    }
  }

  private async updateTeams(leagueId: number, season: number): Promise<void> {
    try {
      const response = await this.makeApiRequest(`/teams?league=${leagueId}&season=${season}`);
      
      if (response.data && response.data.length > 0) {
        for (const teamData of response.data) {
          const team: Partial<Team> = {
            name: teamData.team.name,
            code: teamData.team.code,
            country: teamData.team.country,
            founded: teamData.team.founded,
            national: teamData.team.national,
            logo: teamData.team.logo,
            venue_id: teamData.venue?.id || null
          };

          // Upsert team data
          const { error } = await this.supabase
            .from('teams')
            .upsert([team], { onConflict: 'id' });

          if (error) {
            this.logger.error(`Failed to upsert team ${team.name}:`, error);
          }

          // Update venue if exists
          if (teamData.venue) {
            const venue = {
              id: teamData.venue.id,
              name: teamData.venue.name,
              city: teamData.venue.city,
              capacity: teamData.venue.capacity,
              surface: teamData.venue.surface,
              image: teamData.venue.image
            };

            const { error: venueError } = await this.supabase
              .from('venues')
              .upsert([venue], { onConflict: 'id' });

            if (venueError) {
              this.logger.error(`Failed to upsert venue ${venue.name}:`, venueError);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update teams for league ${leagueId}:`, error);
    }
  }

  private async updateMatches(leagueId: number, season: number, fromDate: string, toDate: string): Promise<void> {
    try {
      const response = await this.makeApiRequest(
        `/fixtures?league=${leagueId}&season=${season}&from=${fromDate}&to=${toDate}`
      );
      
      if (response.data && response.data.length > 0) {
        for (const fixture of response.data) {
          const match: Partial<Match> = {
            date: fixture.fixture.date,
            referee: fixture.fixture.referee,
            venue_id: fixture.fixture.venue?.id || null,
            league_id: fixture.league.id,
            home_team_id: fixture.teams.home.id,
            away_team_id: fixture.teams.away.id,
            home_goals: fixture.goals.home,
            away_goals: fixture.goals.away,
            home_score_halftime: fixture.score.halftime?.home,
            away_score_halftime: fixture.score.halftime?.away,
            home_score_fulltime: fixture.score.fulltime?.home,
            away_score_fulltime: fixture.score.fulltime?.away,
            home_score_extratime: fixture.score.extratime?.home,
            away_score_extratime: fixture.score.extratime?.away,
            home_score_penalty: fixture.score.penalty?.home,
            away_score_penalty: fixture.score.penalty?.away,
            status: this.mapFixtureStatus(fixture.fixture.status.short),
            elapsed: fixture.fixture.status.elapsed
          };

          // Upsert match data
          const { error } = await this.supabase
            .from('matches')
            .upsert([match], { onConflict: 'id' });

          if (error) {
            this.logger.error(`Failed to upsert match ${fixture.fixture.id}:`, error);
          }

          // Update match statistics if available
          if (fixture.statistics && fixture.statistics.length > 0) {
            await this.updateMatchStatistics(fixture.fixture.id, fixture.statistics);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update matches for league ${leagueId}:`, error);
    }
  }

  private async updateMatchStatistics(matchId: number, statistics: any[]): Promise<void> {
    try {
      for (const stat of statistics) {
        const matchStat: Partial<MatchStatistics> = {
          match_id: matchId,
          team_id: stat.team.id,
          shots_on_goal: stat.statistics.find((s: any) => s.type === 'Shots on Goal')?.value,
          shots_off_goal: stat.statistics.find((s: any) => s.type === 'Shots off Goal')?.value,
          total_shots: stat.statistics.find((s: any) => s.type === 'Total Shots')?.value,
          blocked_shots: stat.statistics.find((s: any) => s.type === 'Blocked Shots')?.value,
          shots_inside_box: stat.statistics.find((s: any) => s.type === 'Shots insidebox')?.value,
          shots_outside_box: stat.statistics.find((s: any) => s.type === 'Shots outsidebox')?.value,
          fouls: stat.statistics.find((s: any) => s.type === 'Fouls')?.value,
          corner_kicks: stat.statistics.find((s: any) => s.type === 'Corner Kicks')?.value,
          offsides: stat.statistics.find((s: any) => s.type === 'Offsides')?.value,
          ball_possession: stat.statistics.find((s: any) => s.type === 'Ball Possession')?.value,
          yellow_cards: stat.statistics.find((s: any) => s.type === 'Yellow Cards')?.value,
          red_cards: stat.statistics.find((s: any) => s.type === 'Red Cards')?.value,
          goalkeeper_saves: stat.statistics.find((s: any) => s.type === 'Goalkeeper Saves')?.value,
          total_passes: stat.statistics.find((s: any) => s.type === 'Total passes')?.value,
          passes_accurate: stat.statistics.find((s: any) => s.type === 'Passes accurate')?.value,
          passes_percentage: stat.statistics.find((s: any) => s.type === 'Passes %')?.value,
          expected_goals: stat.statistics.find((s: any) => s.type === 'Expected Goals')?.value
        };

        const { error } = await this.supabase
          .from('match_statistics')
          .upsert([matchStat], { onConflict: 'match_id,team_id' });

        if (error) {
          this.logger.error(`Failed to upsert match statistics for match ${matchId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update match statistics for match ${matchId}:`, error);
    }
  }

  private async makeApiRequest(endpoint: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private mapFixtureStatus(status: string): Match['status'] {
    switch (status) {
      case 'NS': return 'SCHEDULED';
      case '1H': case '2H': case 'HT': return 'LIVE';
      case 'FT': case 'AET': case 'PEN': return 'FINISHED';
      case 'PST': case 'CANC': return 'CANCELLED';
      case 'PEN': return 'FINISHED';
      default: return 'SCHEDULED';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get upcoming matches for predictions
  async getUpcomingMatches(hours: number = 48): Promise<Match[]> {
    try {
      const fromDate = new Date().toISOString();
      const toDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          league:leagues(*)
        `)
        .gte('date', fromDate)
        .lte('date', toDate)
        .eq('status', 'SCHEDULED')
        .order('date', { ascending: true });

      if (error) {
        this.logger.error('Failed to get upcoming matches:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.error('Failed to get upcoming matches:', error);
      return [];
    }
  }

  // Get team statistics for predictions
  async getTeamStatistics(teamId: number, lastMatches: number = 10): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          match_statistics(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('status', 'FINISHED')
        .order('date', { ascending: false })
        .limit(lastMatches);

      if (error) {
        this.logger.error(`Failed to get team statistics for team ${teamId}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      this.logger.error(`Failed to get team statistics for team ${teamId}:`, error);
      return null;
    }
  }
} 