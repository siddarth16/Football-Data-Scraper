import express from 'express';
import { supabase } from '../index';
import { ApiResponse } from '../types';

const router = express.Router();

// Get all leagues
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch leagues'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get league by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'League not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error fetching league:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get league teams
router.get('/:id/teams', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('league_id', id)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch league teams'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: data || []
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error fetching league teams:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router; 