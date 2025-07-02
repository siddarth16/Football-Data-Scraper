/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REACT_APP_SUPABASE_URL: string
  readonly VITE_REACT_APP_SUPABASE_ANON_KEY: string
  readonly VITE_REACT_APP_API_URL: string
  readonly REACT_APP_SUPABASE_URL: string
  readonly REACT_APP_SUPABASE_ANON_KEY: string
  readonly REACT_APP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 