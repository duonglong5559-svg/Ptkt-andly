/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIQUIHEAT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
