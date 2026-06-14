import type { SlideApiRequest, SlideApiResponse, Step } from '../types/index'
import { MOCK_RESPONSES } from '../mocks/mockResponses'

const API_ENDPOINT = '/api/create-slide'
const TIMEOUT_MS = 15000

/**
 * Slide_API クライアント
 * VITE_MOCK_MODE=true のとき固定モックデータを返す
 * Requirements: 9.1, 9.2, 9.3
 */
export async function callSlideApi(req: SlideApiRequest): Promise<SlideApiResponse> {
  // モックモード
  if (import.meta.env.VITE_MOCK_MODE === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return MOCK_RESPONSES[req.current_step as Step]
  }

  // 本番モード
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    return (await response.json()) as SlideApiResponse
  } finally {
    clearTimeout(timeoutId)
  }
}
