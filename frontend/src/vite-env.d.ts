/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** When set, Socket.IO connects here instead of `window.location.origin`. */
  readonly VITE_SOCKET_URL?: string;
}
