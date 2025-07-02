-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    logo TEXT,
    flag TEXT,
    season INTEGER NOT NULL,
    round VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    capacity INTEGER,
    surface VARCHAR(100),
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    country VARCHAR(255),
    founded INTEGER,
    national BOOLEAN DEFAULT FALSE,
    logo TEXT,
    venue_id INTEGER REFERENCES venues(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    referee VARCHAR(255),
    venue_id INTEGER REFERENCES venues(id),
    league_id INTEGER REFERENCES leagues(id),
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_goals INTEGER,
    away_goals INTEGER,
    home_score_halftime INTEGER,
    away_score_halftime INTEGER,
    home_score_fulltime INTEGER,
    away_score_fulltime INTEGER,
    home_score_extratime INTEGER,
    away_score_extratime INTEGER,
    home_score_penalty INTEGER,
    away_score_penalty INTEGER,
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED')),
    elapsed INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_statistics table
CREATE TABLE IF NOT EXISTS match_statistics (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id),
    shots_on_goal INTEGER,
    shots_off_goal INTEGER,
    total_shots INTEGER,
    blocked_shots INTEGER,
    shots_inside_box INTEGER,
    shots_outside_box INTEGER,
    fouls INTEGER,
    corner_kicks INTEGER,
    offsides INTEGER,
    ball_possession INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,
    goalkeeper_saves INTEGER,
    total_passes INTEGER,
    passes_accurate INTEGER,
    passes_percentage INTEGER,
    expected_goals DECIMAL(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, team_id)
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    home_win_probability DECIMAL(5,4) NOT NULL,
    draw_probability DECIMAL(5,4) NOT NULL,
    away_win_probability DECIMAL(5,4) NOT NULL,
    both_teams_score_probability DECIMAL(5,4) NOT NULL,
    over_2_5_goals_probability DECIMAL(5,4) NOT NULL,
    under_2_5_goals_probability DECIMAL(5,4) NOT NULL,
    home_win_or_draw_probability DECIMAL(5,4) NOT NULL,
    away_win_or_draw_probability DECIMAL(5,4) NOT NULL,
    home_handicap_1_5_probability DECIMAL(5,4) NOT NULL,
    away_handicap_1_5_probability DECIMAL(5,4) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id)
);

-- Create user_predictions table for saved predictions
CREATE TABLE IF NOT EXISTS user_predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prediction_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence_score ON predictions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_date ON predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_user_predictions_user_id ON user_predictions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_match_statistics_updated_at BEFORE UPDATE ON match_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Public read access for all tables except user_predictions
CREATE POLICY "Public read access" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read access" ON match_statistics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON predictions FOR SELECT USING (true);

-- User-specific access for user_predictions
CREATE POLICY "Users can view their own saved predictions" ON user_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved predictions" ON user_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved predictions" ON user_predictions FOR DELETE USING (auth.uid() = user_id);

-- Insert access for data updates (this would be restricted in production)
CREATE POLICY "Insert access" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert access" ON venues FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert access" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert access" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert access" ON match_statistics FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert access" ON predictions FOR INSERT WITH CHECK (true);

-- Update access for data updates
CREATE POLICY "Update access" ON leagues FOR UPDATE USING (true);
CREATE POLICY "Update access" ON venues FOR UPDATE USING (true);
CREATE POLICY "Update access" ON teams FOR UPDATE USING (true);
CREATE POLICY "Update access" ON matches FOR UPDATE USING (true);
CREATE POLICY "Update access" ON match_statistics FOR UPDATE USING (true);
CREATE POLICY "Update access" ON predictions FOR UPDATE USING (true);

-- Create a view for match details with team and league information
CREATE OR REPLACE VIEW match_details AS
SELECT 
    m.*,
    ht.name as home_team_name,
    ht.logo as home_team_logo,
    at.name as away_team_name,
    at.logo as away_team_logo,
    l.name as league_name,
    l.logo as league_logo,
    l.country as league_country,
    v.name as venue_name,
    v.city as venue_city
FROM matches m
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN leagues l ON m.league_id = l.id
LEFT JOIN venues v ON m.venue_id = v.id;

-- Create a view for prediction details
CREATE OR REPLACE VIEW prediction_details AS
SELECT 
    p.*,
    md.home_team_name,
    md.home_team_logo,
    md.away_team_name,
    md.away_team_logo,
    md.league_name,
    md.league_logo,
    md.league_country,
    md.date as match_date,
    md.status as match_status
FROM predictions p
JOIN match_details md ON p.match_id = md.id; 