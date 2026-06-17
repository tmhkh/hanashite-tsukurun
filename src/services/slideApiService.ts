import type { SlideApiRequest, SlideApiResponse, Step } from '../types/index'
import { MOCK_RESPONSES } from '../mocks/mockResponses'

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT
  ? `${import.meta.env.VITE_API_ENDPOINT}/api/create-slide`
  : '/api/create-slide'
const TIMEOUT_MS = 15000

/**
 * 認証エラー
 * API から 401 Unauthorized レスポンスを受信した場合にスローされる
 * Requirements: 3.5, 7.5
 */
export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Slide_API クライアント
 * VITE_MOCK_MODE=true のとき固定モックデータを返す
 * Requirements: 9.1, 9.2, 9.3, 3.5, 7.5
 */
export async function callSlideApi(
  req: SlideApiRequest,
  token?: string | null
): Promise<SlideApiResponse> {
  // モックモード
  if (import.meta.env.VITE_MOCK_MODE === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return MOCK_RESPONSES[req.current_step as Step]
  }

  // 本番モード
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
      signal: controller.signal,
    })

    if (response.status === 401) {
      throw new AuthError('Unauthorized')
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    return (await response.json()) as SlideApiResponse
  } finally {
    clearTimeout(timeoutId)
  }
}
