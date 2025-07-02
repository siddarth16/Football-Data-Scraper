import express, { Request, Response } from 'express';
import { supabase } from '../index';
import { PredictionFilters, ApiResponse, PaginatedResponse } from '../types';

const router = express.Router();

// Get all predictions with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      league,
      dateFrom,
      dateTo,
      minConfidence,
      maxConfidence,
      team,
      page = 1,
      limit = 20
    } = req.query as PredictionFilters & { page?: string; limit?: string };

    let query = supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          league:leagues(*)
        )
      `)
      .order('prediction_date', { ascending: false });

    // Apply filters
    if (league) {
      query = query.eq('match.league_id', league);
    }

    if (dateFrom) {
      query = query.gte('match.date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('match.date', dateTo);
    }

    if (minConfidence) {
      query = query.gte('confidence_score', minConfidence);
    }

    if (maxConfidence) {
      query = query.lte('confidence_score', maxConfidence);
    }

    if (team) {
      query = query.or(`match.home_team_id.eq.${team},match.away_team_id.eq.${team}`);
    }

    // Get total count for pagination
    const { count } = await query;

    // Apply pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    query = query.range(offset, offset + limitNum - 1);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch predictions'
      } as ApiResponse<null>);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limitNum);

    const response: PaginatedResponse<any> = {
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse<PaginatedResponse<any>>);

  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get prediction by match ID
router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          league:leagues(*)
        )
      `)
      .eq('match_id', matchId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get high confidence predictions
router.get('/high-confidence', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          league:leagues(*)
        )
      `)
      .gte('confidence_score', 0.7)
      .order('confidence_score', { ascending: false })
      .limit(parseInt(limit as string) || 10);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch high confidence predictions'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching high confidence predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get predictions for today
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          league:leagues(*)
        )
      `)
      .gte('match.date', startOfDay)
      .lt('match.date', endOfDay)
      .order('match.date', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch today\'s predictions'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching today\'s predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get predictions for tomorrow
router.get('/tomorrow', async (req: Request, res: Response) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*),
          league:leagues(*)
        )
      `)
      .gte('match.date', startOfDay)
      .lt('match.date', endOfDay)
      .order('match.date', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch tomorrow\'s predictions'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching tomorrow\'s predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get prediction statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total predictions
    const { count: totalPredictions } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true });

    // Get high confidence predictions
    const { count: highConfidencePredictions } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .gte('confidence_score', 0.7);

    // Get predictions for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { count: todayPredictions } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .gte('match.date', startOfDay)
      .lt('match.date', endOfDay);

    const stats = {
      totalPredictions: totalPredictions || 0,
      highConfidencePredictions: highConfidencePredictions || 0,
      todayPredictions: todayPredictions || 0,
      averageConfidence: 0.65 // This would need to be calculated from actual data
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router; 