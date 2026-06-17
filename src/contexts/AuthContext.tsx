import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import * as cognitoService from '../services/cognitoService'

/**
 * 認証状態
 * Requirements: 7.1
 */
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  idToken: string | null
  error: string | null
}

/**
 * AuthContext が提供する値
 * Requirements: 7.1, 7.2, 7.4
 */
export interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  loginWithPasskey: () => Promise<void>
  logout: () => void
  getToken: () => string | null
}

const SESSION_STORAGE_KEY = 'idToken'

/**
 * モックモードかどうかを判定する
 * VITE_MOCK_MODE=true の場合、認証をバイパスする
 *
 * Requirements: 8.1, 8.2, 8.3
 */
const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthProvider – 認証状態管理プロバイダー
 *
 * - IDトークンをセッションストレージに保持（Requirement 2.7: ローカルストレージ不使用）
 * - リフレッシュトークンはメモリ内変数に保持
 * - アプリ起動時にセッション確認を実施（Requirement 7.2）
 * - VITE_MOCK_MODE=true の場合は認証をスキップし直接認証済み状態にする（Requirement 8.1）
 *
 * Requirements: 7.1, 7.2, 7.4, 2.5, 2.6, 2.7, 8.1, 8.2, 8.3
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // モックモード時は初期状態から認証済み・ロード完了とする（Requirement 8.1）
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

  // リフレッシュトークンはメモリ内のみに保持（XSS 対策、Requirement 2.7）
  const refreshTokenRef = useRef<string | null>(null)

  /**
   * アプリ起動時のセッション確認
   * - モックモード時はスキップ（Requirement 8.1）
   * - セッションストレージにIDトークンがあれば認証済みとして復帰
   * - リフレッシュトークンはメモリのみのため、ページリロード時は
   *   セッションストレージのトークンを信頼する（Design Decision D3）
   *
   * Requirement: 7.2, 8.1
   */
  useEffect(() => {
    // モックモード時はセッション確認をスキップ
    if (isMockMode) {
      return
    }

    const checkSession = async () => {
      try {
        const storedToken = sessionStorage.getItem(SESSION_STORAGE_KEY)
        if (storedToken) {
          // セッションストレージにトークンが残っている場合は認証済みとみなす
          // リフレッシュトークンはメモリにないため自動更新は不可だが、
          // IDトークンが有効な間はそのまま利用する
          setState({
            isAuthenticated: true,
            isLoading: false,
            idToken: storedToken,
            error: null,
          })
        } else {
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    checkSession()
  }, [])

  /**
   * パスワード認証によるログイン
   *
   * - Cognito USER_PASSWORD_AUTH フローを使用
   * - 成功時: IDトークンをセッションストレージ、リフレッシュトークンをメモリに保持
   * - 失敗時: エラーメッセージを state に設定
   *
   * Requirements: 2.3, 2.5
   */
  const login = useCallback(async (username: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const tokens = await cognitoService.initiateAuth(username, password)

      // IDトークンをセッションストレージに保持（Requirement 2.7: ローカルストレージ不使用）
      sessionStorage.setItem(SESSION_STORAGE_KEY, tokens.idToken)

      // リフレッシュトークンはメモリ内変数に保持
      refreshTokenRef.current = tokens.refreshToken

      setState({
        isAuthenticated: true,
        isLoading: false,
        idToken: tokens.idToken,
        error: null,
      })
    } catch (err) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        idToken: null,
        error: 'ログインに失敗しました',
      })
      throw err
    }
  }, [])

  /**
   * パスキー認証（プレースホルダー）
   * Design Decision D1: パスワード認証を初期実装とし、パスキーは将来対応
   */
  const loginWithPasskey = useCallback(async () => {
    // パスキー認証は将来実装（Design Decision D1）
    throw new Error('パスキー認証は現在サポートされていません')
  }, [])

  /**
   * ログアウト
   *
   * - セッションストレージのトークンを破棄
   * - メモリ内のリフレッシュトークンを破棄
   * - 認証状態をリセット
   *
   * Requirement: 7.4
   */
  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    refreshTokenRef.current = null

    setState({
      isAuthenticated: false,
      isLoading: false,
      idToken: null,
      error: null,
    })

    // Cognito 側のサインアウトも実行（ベストエフォート）
    cognitoService.signOut().catch(() => {
      // サインアウト失敗はローカル状態のクリアに影響しない
    })
  }, [])

  /**
   * 現在の有効なIDトークンを取得する
   *
   * - モックモード時は null を返す（Requirement 8.2: トークン付与しない）
   * - トークンが利用可能ならそのまま返す
   * - リフレッシュトークンが利用可能で、IDトークンが期限切れの場合はリフレッシュを試みる
   *   （同期関数のため、リフレッシュは別途 refreshSession で処理）
   *
   * Requirements: 2.5, 8.2
   */
  const getToken = useCallback((): string | null => {
    if (isMockMode) {
      return null
    }
    return state.idToken
  }, [state.idToken])

  /**
   * トークンリフレッシュ
   *
   * - メモリ内のリフレッシュトークンを使って新しいIDトークンを取得
   * - 失敗時は認証状態をリセット（Login_Screen 遷移をトリガー）
   *
   * Requirements: 2.5, 2.6
   */
  const refreshSession = useCallback(async () => {
    const currentRefreshToken = refreshTokenRef.current
    if (!currentRefreshToken) {
      // リフレッシュトークンがない場合は認証状態をリセット
      setState({
        isAuthenticated: false,
        isLoading: false,
        idToken: null,
        error: null,
      })
      return
    }

    try {
      const tokens = await cognitoService.refreshToken(currentRefreshToken)

      sessionStorage.setItem(SESSION_STORAGE_KEY, tokens.idToken)
      refreshTokenRef.current = tokens.refreshToken

      setState({
        isAuthenticated: true,
        isLoading: false,
        idToken: tokens.idToken,
        error: null,
      })
    } catch {
      // リフレッシュ失敗 → 認証状態リセット（Requirement 2.6）
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      refreshTokenRef.current = null

      setState({
        isAuthenticated: false,
        isLoading: false,
        idToken: null,
        error: null,
      })
    }
  }, [])

  // refreshSession をコンテキスト外から呼べるようにするため、
  // 将来的に useSlideApi フック等から利用可能にする
  // 現時点では内部的にのみ使用
  void refreshSession

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithPasskey,
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
 *
 * Requirement: 7.1
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
