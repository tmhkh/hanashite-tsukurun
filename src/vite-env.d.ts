/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_MODE: string | undefined
  readonly VITE_COGNITO_USER_POOL_ID: string | undefined
  readonly VITE_COGNITO_CLIENT_ID: string | undefined
  readonly VITE_COGNITO_REGION: string | undefined
  readonly VITE_API_ENDPOINT: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
