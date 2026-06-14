import { useState, useCallback } from 'react'
import type { SlideApiRequest, SlideApiResponse } from '../types/index'
import { callSlideApi } from '../services/slideApiService'

/**
 * Slide_API 呼び出しカスタムフック
 * Requirements: 3.6, 3.7
 */
export function useSlideApi(): {
  call: (req: SlideApiRequest) => Promise<SlideApiResponse>
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const call = useCallback(async (req: SlideApiRequest): Promise<SlideApiResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await callSlideApi(req)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { call, loading, error }
}
