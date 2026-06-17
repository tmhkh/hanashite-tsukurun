import { useState, useCallback } from 'react'
import type { SlideApiRequest, SlideApiResponse } from '../types/index'
import { callSlideApi, AuthError } from '../services/slideApiService'
import { useAuth } from '../contexts/AuthContext'

/**
 * Slide_API 呼び出しカスタムフック
 *
 * - API 呼び出し時に AuthContext から取得したトークンを付与
 * - AuthError（401）受信時は認証状態をリセットし LoginScreen に遷移させる
 *
 * Requirements: 3.5, 3.6, 3.7, 7.5
 */
export function useSlideApi(): {
  call: (req: SlideApiRequest) => Promise<SlideApiResponse>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getToken, logout } = useAuth()

  const call = useCallback(async (req: SlideApiRequest): Promise<SlideApiResponse> => {
    setLoading(true)
    setError(null)

    try {
      const token = getToken()
      const response = await callSlideApi(req, token)
      return response
    } catch (err) {
      if (err instanceof AuthError) {
        // 認証エラー: AuthContext の状態をリセットし LoginScreen に遷移
        logout()
      }
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getToken, logout])

  return { call, loading, error }
}
