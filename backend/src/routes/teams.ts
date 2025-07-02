import express, { Request, Response } from 'express';
import { supabase } from '../index';
import { ApiResponse, PaginatedResponse } from '../types';

const router = express.Router();

// Get all teams
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, country, league } = req.query;

    let query = supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (country) {
      query = query.eq('country', country);
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
        error: 'Failed to fetch teams'
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
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get team by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        venue:venues(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get team matches
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        league:leagues(*)
      `)
      .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
      .order('date', { ascending: false })
      .limit(parseInt(limit as string) || 10);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch team matches'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching team matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get teams by league ID
router.get('/league/:leagueId', async (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('league_id', leagueId)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching teams by league:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router; 