import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  type InitiateAuthCommandInput,
  type AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider'

/**
 * Cognito 認証サービス
 * Requirements: 1.5, 2.3, 2.5
 */

export interface CognitoConfig {
  userPoolId: string
  clientId: string
  region: string
}

export interface AuthTokens {
  idToken: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}

function getConfig(): CognitoConfig {
  return {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
    region: import.meta.env.VITE_COGNITO_REGION ?? 'ap-northeast-1',
  }
}

function createClient(): CognitoIdentityProviderClient {
  const config = getConfig()
  return new CognitoIdentityProviderClient({ region: config.region })
}

function parseAuthResult(result: AuthenticationResultType | undefined): AuthTokens {
  if (!result?.IdToken || !result?.AccessToken) {
    throw new Error('認証レスポンスが不正です')
  }
  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken ?? '',
    expiresIn: result.ExpiresIn ?? 3600,
  }
}

/**
 * ユーザー名・パスワードで認証を開始する（USER_PASSWORD_AUTH フロー）
 */
export async function initiateAuth(username: string, password: string): Promise<AuthTokens> {
  const config = getConfig()
  const client = createClient()

  const input: InitiateAuthCommandInput = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  }

  const command = new InitiateAuthCommand(input)
  const response = await client.send(command)

  return parseAuthResult(response.AuthenticationResult)
}

/**
 * リフレッシュトークンで新しいトークンを取得する（REFRESH_TOKEN_AUTH フロー）
 */
export async function refreshToken(token: string): Promise<AuthTokens> {
  const config = getConfig()
  const client = createClient()

  const input: InitiateAuthCommandInput = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: config.clientId,
    AuthParameters: {
      REFRESH_TOKEN: token,
    },
  }

  const command = new InitiateAuthCommand(input)
  const response = await client.send(command)

  const result = parseAuthResult(response.AuthenticationResult)
  // REFRESH_TOKEN_AUTH はリフレッシュトークン自体を返さないため、元のトークンを引き継ぐ
  if (!result.refreshToken) {
    result.refreshToken = token
  }
  return result
}

/**
 * サインアウト（ローカル状態のクリア）
 * 単一ユーザー前提のため、サーバーサイドのサインアウトは不要
 */
export async function signOut(): Promise<void> {
  // ローカルのセッションストレージをクリア
  sessionStorage.removeItem('idToken')
  sessionStorage.removeItem('accessToken')
}
