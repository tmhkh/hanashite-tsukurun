import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MOCK_RESPONSES } from '../mocks/mockResponses'
import type { SlideApiRequest } from '../types/index'

// テスト用のリクエストデータ
function makeRequest(step: 1 | 2 | 3): SlideApiRequest {
  return {
    grade: 'grade1',
    current_step: step,
    user_speech: 'テスト発話',
    history: [],
  }
}

describe('slideApiService', () => {
  let originalEnv: Record<string, string>

  beforeEach(() => {
    originalEnv = { ...import.meta.env }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    // Reset env
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete (import.meta.env as Record<string, unknown>)[key]
      }
    })
    Object.entries(originalEnv).forEach(([key, value]) => {
      ;(import.meta.env as Record<string, unknown>)[key] = value
    })
  })

  describe('モックモード (VITE_MOCK_MODE=true)', () => {
    beforeEach(() => {
      ;(import.meta.env as Record<string, unknown>).VITE_MOCK_MODE = 'true'
    })

    it('Step 1 でモックレスポンスを返す', async () => {
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(1))
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual(MOCK_RESPONSES[1])
      expect(result.slide_title).toBe('すきなどうぶつ')
      expect(result.next_step).toBe(2)
      expect(result.script).toBe('')
    })

    it('Step 2 でモックレスポンスを返す', async () => {
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(2))
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual(MOCK_RESPONSES[2])
      expect(result.slide_title).toBe('どんなところがすき？')
      expect(result.next_step).toBe(3)
      expect(result.script).toBe('')
    })

    it('Step 3 でモックレスポンスを返す（script が非空）', async () => {
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(3))
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual(MOCK_RESPONSES[3])
      expect(result.slide_title).toBe('まとめ')
      expect(result.next_step).toBe(4)
      expect(result.script.length).toBeGreaterThan(0)
    })

    it('モックモードでは fetch を呼び出さない', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(1))
      await vi.advanceTimersByTimeAsync(500)
      await promise

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('モックモードでは約500msの遅延がある', async () => {
      const { callSlideApi } = await import('./slideApiService')

      let resolved = false
      const promise = callSlideApi(makeRequest(1)).then(() => {
        resolved = true
      })

      // 400ms時点ではまだ解決していない
      await vi.advanceTimersByTimeAsync(400)
      expect(resolved).toBe(false)

      // 500ms経過後に解決する
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(resolved).toBe(true)
    })
  })

  describe('本番モード (VITE_MOCK_MODE 未設定または "true" 以外)', () => {
    it('VITE_MOCK_MODE 未設定のとき fetch を呼び出す', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_MOCK_MODE
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            slide_title: 'テスト',
            slide_text: 'テスト内容',
            image_keyword: 'star',
            ai_response_voice: 'テスト音声',
            next_step: 2,
            script: '',
          }),
      }
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockResponse as Response)

      const { callSlideApi } = await import('./slideApiService')
      await callSlideApi(makeRequest(1))

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/create-slide',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('VITE_MOCK_MODE="false" のとき fetch を呼び出す', async () => {
      ;(import.meta.env as Record<string, unknown>).VITE_MOCK_MODE = 'false'
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            slide_title: 'テスト',
            slide_text: 'テスト内容',
            image_keyword: 'star',
            ai_response_voice: 'テスト音声',
            next_step: 2,
            script: '',
          }),
      }
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockResponse as Response)

      const { callSlideApi } = await import('./slideApiService')
      await callSlideApi(makeRequest(1))

      expect(fetchSpy).toHaveBeenCalled()
    })

    it('VITE_MOCK_MODE="" (空文字) のとき fetch を呼び出す', async () => {
      ;(import.meta.env as Record<string, unknown>).VITE_MOCK_MODE = ''
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            slide_title: 'テスト',
            slide_text: 'テスト内容',
            image_keyword: 'star',
            ai_response_voice: 'テスト音声',
            next_step: 2,
            script: '',
          }),
      }
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockResponse as Response)

      const { callSlideApi } = await import('./slideApiService')
      await callSlideApi(makeRequest(1))

      expect(fetchSpy).toHaveBeenCalled()
    })

    it('HTTP エラー時に例外を throw する', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_MOCK_MODE
      const mockResponse = {
        ok: false,
        status: 500,
      }
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockResponse as Response
      )

      const { callSlideApi } = await import('./slideApiService')

      await expect(callSlideApi(makeRequest(1))).rejects.toThrow(
        'HTTP error: 500'
      )
    })
  })
})
