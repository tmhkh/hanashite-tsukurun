import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import * as authClient from '../services/authClient'

/**
 * 認証設定を環境変数から取得
 */
function getAuthConfig(): authClient.AuthConfig {
  return {
    domain: import.meta.env.VITE_COGNITO_DOMAIN ?? '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
    redirectUri: `${window.location.origin}/callback`,
    logoutUri: window.location.origin,
  }
}

/**
 * 認証状態
 */
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  idToken: string | null
  error: string | null
}

/**
 * AuthContext が提供する値
 */
export interface AuthContextValue extends AuthState {
  login: () => Promise<void>
  logout: () => void
  getToken: () => string | null
}

/**
 * モックモードかどうかを判定する
 * VITE_MOCK_MODE=true の場合、認証をバイパスする
 */
const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthProvider – 認証状態管理プロバイダー
 *
 * - Cognito Managed Login (OAuth PKCE) による認証
 * - IDトークンをセッションストレージに保持
 * - OAuth コールバック時に自動的にトークン交換を実行
 * - VITE_MOCK_MODE=true の場合は認証をスキップ
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (isMockMode) {
      return {
        isAuthenticated: true,
        isLoading: false,
        idToken: null,
        error: null,
      }
    }
    return {
      isAuthenticated: false,
      isLoading: true,
      idToken: null,
      error: null,
    }
  })

  /**
   * アプリ起動時のセッション確認 & OAuth コールバック処理
   */
  useEffect(() => {
    if (isMockMode) {
      return
    }

    const initialize = async () => {
      // OAuth コールバック URL の場合はトークン交換を実行
      if (authClient.isCallbackUrl()) {
        try {
          const config = getAuthConfig()
          const token = await authClient.handleCallback(config)
          if (token) {
            // URL からクエリパラメータを除去
            window.history.replaceState({}, '', window.location.pathname)
            setState({
              isAuthenticated: true,
              isLoading: false,
              idToken: token,
              error: null,
            })
            return
          }
        } catch {
          // コールバック処理失敗
        }
        setState({
          isAuthenticated: false,
          isLoading: false,
          idToken: null,
          error: '認証に失敗しました',
        })
        return
      }

      // 既存のセッション確認
      const storedToken = authClient.getToken()
      if (storedToken) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          idToken: storedToken,
          error: null,
        })
      } else {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    initialize()
  }, [])

  /**
   * ログイン: Cognito Managed Login にリダイレクト
   */
  const login = useCallback(async () => {
    const config = getAuthConfig()
    await authClient.login(config)
  }, [])

  /**
   * ログアウト: トークン破棄 + Cognito ログアウトエンドポイントにリダイレクト
   */
  const logout = useCallback(() => {
    const config = getAuthConfig()
    authClient.logout(config)
  }, [])

  /**
   * 現在の有効なIDトークンを取得する
   */
  const getToken = useCallback((): string | null => {
    if (isMockMode) {
      return null
    }
    return state.idToken
  }, [state.idToken])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    getToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth カスタムフック
 *
 * AuthContext から認証状態と操作関数を取得する。
 * AuthProvider の外で使用した場合はエラーをスローする。
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください')
  }
  return context
}
