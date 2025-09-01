/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_REAL_API?: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}