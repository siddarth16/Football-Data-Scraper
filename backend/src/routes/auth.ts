import express from 'express';
import { supabase } from '../index';
import { ApiResponse } from '../types';

const router = express.Router();

// Get current user
router.get('/user', async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: user
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data,
      message: 'User registered successfully'
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data,
      message: 'Signed in successfully'
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    } as ApiResponse<null>);

  } catch (error) {
    console.error('Error signing out:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Save user prediction
router.post('/save-prediction', async (req, res) => {
  try {
    const { predictionId } = req.body;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('user_predictions')
      .insert({
        user_id: user.id,
        prediction_id: predictionId
      });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data,
      message: 'Prediction saved successfully'
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error saving prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

// Get user saved predictions
router.get('/saved-predictions', async (req, res) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse<null>);
    }

    const { data, error } = await supabase
      .from('user_predictions')
      .select(`
        *,
        prediction:predictions(
          *,
          match:matches(
            *,
            home_team:teams!home_team_id(*),
            away_team:teams!away_team_id(*),
            league:leagues(*)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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
    console.error('Error fetching saved predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
});

export default router; 