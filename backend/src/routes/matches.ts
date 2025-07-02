import express, { Request, Response } from 'express';
import { supabase } from '../index';
import { MatchFilters, ApiResponse, PaginatedResponse } from '../types';

const router = express.Router();

// Get all matches with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      league,
      team,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query as MatchFilters & { page?: string; limit?: string };

    let query = supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        league:leagues(*),
        venue:venues(*)
      `)
      .order('date', { ascending: false });

    // Apply filters
    if (league) {
      query = query.eq('league_id', league);
    }

    if (team) {
      query = query.or(`home_team_id.eq.${team},away_team_id.eq.${team}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
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
        error: 'Failed to fetch matches'
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
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get match by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        league:leagues(*),
        venue:venues(*),
        match_statistics(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get live matches
router.get('/live/current', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        league:leagues(*)
      `)
      .eq('status', 'LIVE')
      .order('date', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch live matches'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get upcoming matches
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const { hours = 48 } = req.query;
    const fromDate = new Date().toISOString();
    const toDate = new Date(Date.now() + parseInt(hours as string) * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
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
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming matches'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get recent matches
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const fromDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString();
    const toDate = new Date().toISOString();

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*),
        league:leagues(*)
      `)
      .gte('date', fromDate)
      .lte('date', toDate)
      .eq('status', 'FINISHED')
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recent matches'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching recent matches:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router; 