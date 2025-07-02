import { SupabaseClient } from '@supabase/supabase-js';
import winston from 'winston';
import moment from 'moment';
import { 
  Match, 
  Prediction, 
  PredictionResult, 
  TeamFormStats, 
  HeadToHeadStats 
} from '../types';

export class PredictionService {
  private supabase: SupabaseClient;
  private logger: winston.Logger;

  constructor(supabase: SupabaseClient, logger: winston.Logger) {
    this.supabase = supabase;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing PredictionService...');
    
    try {
      // Generate initial predictions
      await this.generatePredictions();
      
      this.logger.info('PredictionService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PredictionService:', error);
      throw error;
    }
  }

  async generatePredictions(): Promise<void> {
    this.logger.info('Starting prediction generation...');
    
    try {
      // Get upcoming matches
      const upcomingMatches = await this.getUpcomingMatches();
      
      for (const match of upcomingMatches) {
        try {
          const prediction = await this.generateMatchPrediction(match);
          if (prediction) {
            await this.savePrediction(prediction);
          }
        } catch (error) {
          this.logger.error(`Failed to generate prediction for match ${match.id}:`, error);
        }
      }
      
      this.logger.info(`Generated predictions for ${upcomingMatches.length} matches`);
    } catch (error) {
      this.logger.error('Failed to generate predictions:', error);
      throw error;
    }
  }

  private async generateMatchPrediction(match: any): Promise<Partial<Prediction> | null> {
    try {
      // Get team statistics
      const homeTeamStats = await this.getTeamFormStats(match.home_team_id, true);
      const awayTeamStats = await this.getTeamFormStats(match.away_team_id, false);
      
      // Get head-to-head statistics
      const headToHead = await this.getHeadToHeadStats(match.home_team_id, match.away_team_id);
      
      // Calculate probabilities
      const homeWinProb = this.calculateHomeWinProbability(homeTeamStats, awayTeamStats, headToHead);
      const awayWinProb = this.calculateAwayWinProbability(homeTeamStats, awayTeamStats, headToHead);
      const drawProb = Math.max(0, 1 - homeWinProb - awayWinProb);
      
      // Calculate other betting markets
      const bothTeamsScoreProb = this.calculateBothTeamsScoreProbability(homeTeamStats, awayTeamStats, headToHead);
      const over2_5GoalsProb = this.calculateOver2_5GoalsProbability(homeTeamStats, awayTeamStats, headToHead);
      const under2_5GoalsProb = Math.max(0, 1 - over2_5GoalsProb);
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(homeTeamStats, awayTeamStats, headToHead);
      
      const prediction: Partial<Prediction> = {
        match_id: match.id,
        home_win_probability: homeWinProb,
        draw_probability: drawProb,
        away_win_probability: awayWinProb,
        both_teams_score_probability: bothTeamsScoreProb,
        over_2_5_goals_probability: over2_5GoalsProb,
        under_2_5_goals_probability: under2_5GoalsProb,
        home_win_or_draw_probability: homeWinProb + drawProb,
        away_win_or_draw_probability: awayWinProb + drawProb,
        home_handicap_1_5_probability: this.calculateHandicapProbability(homeWinProb, 1.5),
        away_handicap_1_5_probability: this.calculateHandicapProbability(awayWinProb, 1.5),
        confidence_score: confidenceScore,
        prediction_date: new Date().toISOString()
      };

      return prediction;
    } catch (error) {
      this.logger.error(`Failed to generate prediction for match ${match.id}:`, error);
      return null;
    }
  }

  private async getTeamFormStats(teamId: number, isHome: boolean): Promise<TeamFormStats> {
    try {
      const { data: matches, error } = await this.supabase
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
        .limit(10);

      if (error || !matches) {
        return this.getDefaultTeamStats();
      }

      const teamMatches = matches.filter(match => 
        match.home_team_id === teamId || match.away_team_id === teamId
      );

      const recentForm = teamMatches.slice(0, 5).map(match => {
        const isHomeTeam = match.home_team_id === teamId;
        const teamGoals = isHomeTeam ? match.home_goals : match.away_goals;
        const opponentGoals = isHomeTeam ? match.away_goals : match.home_goals;
        
        if (teamGoals > opponentGoals) return 'W';
        if (teamGoals < opponentGoals) return 'L';
        return 'D';
      });

      const goalsScored = teamMatches.reduce((total, match) => {
        const isHomeTeam = match.home_team_id === teamId;
        return total + (isHomeTeam ? match.home_goals : match.away_goals);
      }, 0);

      const goalsConceded = teamMatches.reduce((total, match) => {
        const isHomeTeam = match.home_team_id === teamId;
        return total + (isHomeTeam ? match.away_goals : match.home_goals);
      }, 0);

      const cleanSheets = teamMatches.filter(match => {
        const isHomeTeam = match.home_team_id === teamId;
        const opponentGoals = isHomeTeam ? match.away_goals : match.home_goals;
        return opponentGoals === 0;
      }).length;

      const failedToScore = teamMatches.filter(match => {
        const isHomeTeam = match.home_team_id === teamId;
        const teamGoals = isHomeTeam ? match.home_goals : match.away_goals;
        return teamGoals === 0;
      }).length;

      const averageGoalsScored = goalsScored / teamMatches.length;
      const averageGoalsConceded = goalsConceded / teamMatches.length;

      // Calculate home/away advantage
      const homeMatches = teamMatches.filter(match => match.home_team_id === teamId);
      const awayMatches = teamMatches.filter(match => match.away_team_id === teamId);

      let homeAdvantage = 0;
      let awayDisadvantage = 0;

      if (isHome && homeMatches.length > 0) {
        const homeGoalsScored = homeMatches.reduce((total, match) => total + match.home_goals, 0);
        const homeGoalsConceded = homeMatches.reduce((total, match) => total + match.away_goals, 0);
        homeAdvantage = (homeGoalsScored / homeMatches.length) - averageGoalsScored;
      }

      if (!isHome && awayMatches.length > 0) {
        const awayGoalsScored = awayMatches.reduce((total, match) => total + match.away_goals, 0);
        const awayGoalsConceded = awayMatches.reduce((total, match) => total + match.home_goals, 0);
        awayDisadvantage = averageGoalsScored - (awayGoalsScored / awayMatches.length);
      }

      return {
        recentForm,
        goalsScored,
        goalsConceded,
        cleanSheets,
        failedToScore,
        averageGoalsScored,
        averageGoalsConceded,
        homeAdvantage,
        awayDisadvantage
      };
    } catch (error) {
      this.logger.error(`Failed to get team form stats for team ${teamId}:`, error);
      return this.getDefaultTeamStats();
    }
  }

  private async getHeadToHeadStats(homeTeamId: number, awayTeamId: number): Promise<HeadToHeadStats> {
    try {
      const { data: matches, error } = await this.supabase
        .from('matches')
        .select('*')
        .or(`and(home_team_id.eq.${homeTeamId},away_team_id.eq.${awayTeamId}),and(home_team_id.eq.${awayTeamId},away_team_id.eq.${homeTeamId})`)
        .eq('status', 'FINISHED')
        .order('date', { ascending: false })
        .limit(10);

      if (error || !matches) {
        return this.getDefaultHeadToHeadStats();
      }

      const totalMatches = matches.length;
      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;
      let totalGoals = 0;
      let bothTeamsScored = 0;
      let over2_5Goals = 0;

      matches.forEach(match => {
        const isHomeTeamHome = match.home_team_id === homeTeamId;
        const homeGoals = isHomeTeamHome ? match.home_goals : match.away_goals;
        const awayGoals = isHomeTeamHome ? match.away_goals : match.home_goals;
        
        totalGoals += homeGoals + awayGoals;
        
        if (homeGoals > awayGoals) {
          homeWins++;
        } else if (awayGoals > homeGoals) {
          awayWins++;
        } else {
          draws++;
        }
        
        if (homeGoals > 0 && awayGoals > 0) {
          bothTeamsScored++;
        }
        
        if (homeGoals + awayGoals > 2.5) {
          over2_5Goals++;
        }
      });

      return {
        totalMatches,
        homeWins,
        awayWins,
        draws,
        averageGoals: totalMatches > 0 ? totalGoals / totalMatches : 0,
        bothTeamsScored,
        over2_5Goals
      };
    } catch (error) {
      this.logger.error(`Failed to get head-to-head stats for teams ${homeTeamId} vs ${awayTeamId}:`, error);
      return this.getDefaultHeadToHeadStats();
    }
  }

  private calculateHomeWinProbability(homeStats: TeamFormStats, awayStats: TeamFormStats, h2h: HeadToHeadStats): number {
    // Base probability from recent form
    const homeFormWeight = 0.4;
    const awayFormWeight = 0.3;
    const h2hWeight = 0.3;

    const homeFormScore = this.calculateFormScore(homeStats.recentForm);
    const awayFormScore = this.calculateFormScore(awayStats.recentForm);
    
    // Head-to-head factor
    const h2hFactor = h2h.totalMatches > 0 ? h2h.homeWins / h2h.totalMatches : 0.5;
    
    // Goals factor
    const homeGoalsFactor = Math.min(1, homeStats.averageGoalsScored / 2);
    const awayGoalsFactor = Math.max(0, 1 - awayStats.averageGoalsConceded / 2);
    
    // Home advantage
    const homeAdvantage = 0.1;
    
    const probability = (
      homeFormWeight * homeFormScore +
      awayFormWeight * (1 - awayFormScore) +
      h2hWeight * h2hFactor +
      homeAdvantage +
      (homeGoalsFactor + awayGoalsFactor) * 0.1
    ) / (homeFormWeight + awayFormWeight + h2hWeight + 0.1 + 0.2);

    return Math.max(0.1, Math.min(0.9, probability));
  }

  private calculateAwayWinProbability(homeStats: TeamFormStats, awayStats: TeamFormStats, h2h: HeadToHeadStats): number {
    // Similar to home win but with away perspective
    const homeFormWeight = 0.3;
    const awayFormWeight = 0.4;
    const h2hWeight = 0.3;

    const homeFormScore = this.calculateFormScore(homeStats.recentForm);
    const awayFormScore = this.calculateFormScore(awayStats.recentForm);
    
    const h2hFactor = h2h.totalMatches > 0 ? h2h.awayWins / h2h.totalMatches : 0.3;
    
    const awayGoalsFactor = Math.min(1, awayStats.averageGoalsScored / 2);
    const homeGoalsFactor = Math.max(0, 1 - homeStats.averageGoalsConceded / 2);
    
    // Away disadvantage
    const awayDisadvantage = -0.05;
    
    const probability = (
      homeFormWeight * (1 - homeFormScore) +
      awayFormWeight * awayFormScore +
      h2hWeight * h2hFactor +
      awayDisadvantage +
      (awayGoalsFactor + homeGoalsFactor) * 0.1
    ) / (homeFormWeight + awayFormWeight + h2hWeight + 0.05 + 0.2);

    return Math.max(0.05, Math.min(0.8, probability));
  }

  private calculateBothTeamsScoreProbability(homeStats: TeamFormStats, awayStats: TeamFormStats, h2h: HeadToHeadStats): number {
    const homeScoringProb = Math.min(1, homeStats.averageGoalsScored / 1.5);
    const awayScoringProb = Math.min(1, awayStats.averageGoalsScored / 1.5);
    const homeConcedingProb = Math.min(1, homeStats.averageGoalsConceded / 1.5);
    const awayConcedingProb = Math.min(1, awayStats.averageGoalsConceded / 1.5);
    
    const h2hFactor = h2h.totalMatches > 0 ? h2h.bothTeamsScored / h2h.totalMatches : 0.6;
    
    const probability = (
      homeScoringProb * 0.3 +
      awayScoringProb * 0.3 +
      homeConcedingProb * 0.2 +
      awayConcedingProb * 0.2 +
      h2hFactor * 0.3
    ) / 1.3;

    return Math.max(0.2, Math.min(0.9, probability));
  }

  private calculateOver2_5GoalsProbability(homeStats: TeamFormStats, awayStats: TeamFormStats, h2h: HeadToHeadStats): number {
    const totalAverageGoals = homeStats.averageGoalsScored + awayStats.averageGoalsScored;
    const goalsFactor = Math.min(1, totalAverageGoals / 3);
    
    const h2hFactor = h2h.totalMatches > 0 ? h2h.over2_5Goals / h2h.totalMatches : 0.5;
    
    const probability = (goalsFactor * 0.7 + h2hFactor * 0.3) / 1;
    
    return Math.max(0.2, Math.min(0.9, probability));
  }

  private calculateHandicapProbability(baseProbability: number, handicap: number): number {
    // Simple handicap calculation
    const handicapFactor = handicap * 0.1;
    return Math.max(0.1, Math.min(0.9, baseProbability - handicapFactor));
  }

  private calculateConfidenceScore(homeStats: TeamFormStats, awayStats: TeamFormStats, h2h: HeadToHeadStats): number {
    // Factors that increase confidence:
    // - More recent matches
    // - Consistent form
    // - More head-to-head matches
    // - Clear goal patterns
    
    const homeFormConsistency = this.calculateFormConsistency(homeStats.recentForm);
    const awayFormConsistency = this.calculateFormConsistency(awayStats.recentForm);
    const h2hConfidence = Math.min(1, h2h.totalMatches / 5);
    
    const confidence = (
      homeFormConsistency * 0.3 +
      awayFormConsistency * 0.3 +
      h2hConfidence * 0.4
    );

    return Math.max(0.1, Math.min(1, confidence));
  }

  private calculateFormScore(form: string[]): number {
    if (form.length === 0) return 0.5;
    
    const weights = [0.4, 0.3, 0.2, 0.08, 0.02]; // Most recent matches have higher weight
    let score = 0;
    
    form.forEach((result, index) => {
      const weight = weights[index] || 0.01;
      switch (result) {
        case 'W': score += weight; break;
        case 'D': score += weight * 0.5; break;
        case 'L': score += 0; break;
      }
    });
    
    return score;
  }

  private calculateFormConsistency(form: string[]): number {
    if (form.length < 2) return 0.5;
    
    const wins = form.filter(r => r === 'W').length;
    const draws = form.filter(r => r === 'D').length;
    const losses = form.filter(r => r === 'L').length;
    
    const total = form.length;
    const maxCategory = Math.max(wins, draws, losses);
    
    return maxCategory / total;
  }

  private getDefaultTeamStats(): TeamFormStats {
    return {
      recentForm: ['D', 'D', 'D', 'D', 'D'],
      goalsScored: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      failedToScore: 0,
      averageGoalsScored: 1.0,
      averageGoalsConceded: 1.0
    };
  }

  private getDefaultHeadToHeadStats(): HeadToHeadStats {
    return {
      totalMatches: 0,
      homeWins: 0,
      awayWins: 0,
      draws: 0,
      averageGoals: 2.5,
      bothTeamsScored: 0,
      over2_5Goals: 0
    };
  }

  private async getUpcomingMatches(): Promise<Match[]> {
    try {
      const fromDate = new Date().toISOString();
      const toDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('matches')
        .select('*')
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

  private async savePrediction(prediction: Partial<Prediction>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('predictions')
        .upsert([prediction], { onConflict: 'match_id' });

      if (error) {
        this.logger.error('Failed to save prediction:', error);
      }
    } catch (error) {
      this.logger.error('Failed to save prediction:', error);
    }
  }
} 