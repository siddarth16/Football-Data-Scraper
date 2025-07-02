// Configuration file for environment variables
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_REACT_APP_API_URL || 
          import.meta.env.REACT_APP_API_URL || 
          'https://football-backend-aiyd.onrender.com/api',
  
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_REACT_APP_SUPABASE_URL || 
         import.meta.env.REACT_APP_SUPABASE_URL || 
         '',
    anonKey: import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY || 
             import.meta.env.REACT_APP_SUPABASE_ANON_KEY || 
             ''
  }
};

// Debug logging
console.log('Config loaded:', {
  apiUrl: config.apiUrl,
  supabaseUrl: config.supabase.url,
  supabaseKeyLength: config.supabase.anonKey.length,
  allEnvVars: Object.keys(import.meta.env)
});

// Validate configuration
if (!config.supabase.url) {
  console.error('❌ SUPABASE_URL is missing!');
  console.error('Available environment variables:', Object.keys(import.meta.env));
  console.error('Please check your Render environment variables.');
}

if (!config.supabase.anonKey) {
  console.error('❌ SUPABASE_ANON_KEY is missing!');
}

if (!config.apiUrl) {
  console.error('❌ API_URL is missing!');
} 