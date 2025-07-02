// Database types
export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
  season: number;
  round: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  country: string;
  founded: number;
  national: boolean;
  logo: string;
  venue_id: number;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: number;
  name: string;
  city: string;
  capacity: number;
  surface: string;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  date: string;
  referee: string;
  venue_id: number;
  league_id: number;
  home_team_id: number;
  away_team_id: number;
  home_goals: number | null;
  away_goals: number | null;
  home_score_halftime: number | null;
  away_score_halftime: number | null;
  home_score_fulltime: number | null;
  away_score_fulltime: number | null;
  home_score_extratime: number | null;
  away_score_extratime: number | null;
  home_score_penalty: number | null;
  away_score_penalty: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  elapsed: number | null;
  created_at: string;
  updated_at: string;
}

export interface MatchStatistics {
  id: number;
  match_id: number;
  team_id: number;
  shots_on_goal: number | null;
  shots_off_goal: number | null;
  total_shots: number | null;
  blocked_shots: number | null;
  shots_inside_box: number | null;
  shots_outside_box: number | null;
  fouls: number | null;
  corner_kicks: number | null;
  offsides: number | null;
  ball_possession: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  goalkeeper_saves: number | null;
  total_passes: number | null;
  passes_accurate: number | null;
  passes_percentage: number | null;
  expected_goals: number | null;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
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
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface UserPrediction {
  id: number;
  user_id: string;
  prediction_id: number;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Prediction types
export interface PredictionResult {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  predictions: {
    homeWin: { probability: number; confidence: number };
    draw: { probability: number; confidence: number };
    awayWin: { probability: number; confidence: number };
    bothTeamsScore: { probability: number; confidence: number };
    over2_5Goals: { probability: number; confidence: number };
    under2_5Goals: { probability: number; confidence: number };
    homeWinOrDraw: { probability: number; confidence: number };
    awayWinOrDraw: { probability: number; confidence: number };
  };
  teamStats: {
    home: TeamFormStats;
    away: TeamFormStats;
  };
  headToHead: HeadToHeadStats;
}

export interface TeamFormStats {
  recentForm: string[];
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  failedToScore: number;
  averageGoalsScored: number;
  averageGoalsConceded: number;
  homeAdvantage?: number;
  awayDisadvantage?: number;
}

export interface HeadToHeadStats {
  totalMatches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  averageGoals: number;
  bothTeamsScored: number;
  over2_5Goals: number;
}

// Filter types
export interface PredictionFilters {
  league?: number;
  dateFrom?: string;
  dateTo?: string;
  minConfidence?: number;
  maxConfidence?: number;
  team?: number;
}

export interface MatchFilters {
  league?: number;
  team?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Configuration types
export interface AppConfig {
  apiFootballKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  frontendUrl: string;
  nodeEnv: string;
  port: number;
}

// League configuration
export interface LeagueConfig {
  id: number;
  name: string;
  country: string;
  apiId: number;
  active: boolean;
  priority: number;
}

export const SUPPORTED_LEAGUES: LeagueConfig[] = [
  { id: 1, name: 'Premier League', country: 'England', apiId: 39, active: true, priority: 1 },
  { id: 2, name: 'La Liga', country: 'Spain', apiId: 140, active: true, priority: 1 },
  { id: 3, name: 'Serie A', country: 'Italy', apiId: 135, active: true, priority: 1 },
  { id: 4, name: 'Bundesliga', country: 'Germany', apiId: 78, active: true, priority: 1 },
  { id: 5, name: 'Ligue 1', country: 'France', apiId: 61, active: true, priority: 1 },
  { id: 6, name: 'Brasileirão', country: 'Brazil', apiId: 71, active: true, priority: 2 },
  { id: 7, name: 'UEFA Champions League', country: 'Europe', apiId: 2, active: true, priority: 1 },
  { id: 8, name: 'Club World Cup', country: 'World', apiId: 73, active: true, priority: 3 },
  { id: 9, name: 'Veikkausliiga', country: 'Finland', apiId: 106, active: true, priority: 3 },
  { id: 10, name: 'Eliteserien', country: 'Norway', apiId: 103, active: true, priority: 3 },
  { id: 11, name: 'Allsvenskan', country: 'Sweden', apiId: 113, active: true, priority: 3 }
]; 