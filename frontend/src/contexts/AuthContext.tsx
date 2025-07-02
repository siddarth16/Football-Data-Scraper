import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('Environment Variables Debug:');
console.log('VITE_REACT_APP_SUPABASE_URL:', import.meta.env.VITE_REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_URL:', import.meta.env.REACT_APP_SUPABASE_URL);
console.log('Final supabaseUrl:', supabaseUrl);
console.log('Final supabaseKey length:', supabaseKey.length);

if (!supabaseUrl) {
  console.error('SUPABASE_URL is missing!');
  console.error('Available env vars:', Object.keys(import.meta.env));
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Registration successful! Please check your email to verify your account.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Sign out failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 