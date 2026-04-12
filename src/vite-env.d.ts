/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_USE_MOCK_BUSINESSES?: string;
  readonly VITE_USE_MOCK_REVIEWS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
