import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MOCK_RESPONSES } from '../mocks/mockResponses'
import type { SlideApiRequest } from '../types/index'

function makeRequest(step: 1 | 2 | 3): SlideApiRequest {
  return {
    grade: 'grade1',
    current_step: step,
    user_speech: 'test',
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
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete (import.meta.env as Record<string, unknown>)[key]
      }
    })
    Object.entries(originalEnv).forEach(([key, value]) => {
      ;(import.meta.env as Record<string, unknown>)[key] = value
    })
  })

  describe('mock mode (VITE_MOCK_MODE=true)', () => {
    beforeEach(() => {
      ;(import.meta.env as Record<string, unknown>).VITE_MOCK_MODE = 'true'
    })

    it('Step 1 returns mock response', async () => {
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(1))
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual(MOCK_RESPONSES[1])
      expect(result.slide_title).toBe(MOCK_RESPONSES[1].slide_title)
      expect(result.next_step).toBe(2)
      expect(result.marp_markdown).toBe('')
    })

    it('Step 2 returns mock response', async () => {
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(2))
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual(MOCK_RESPONSES[2])
      expect(result.slide_title).toBe(MOCK_RESPONSES[2].slide_title)
      expect(result.next_step).toBe(3)
      expect(result.marp_markdown).toBe('')
    })

    it('Step 3 returns mock response with non-empty marp_markdown', async () => {
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(3))
      await vi.advanceTimersByTimeAsync(500)
      const result = await promise

      expect(result).toEqual(MOCK_RESPONSES[3])
      expect(result.slide_title).toBe(MOCK_RESPONSES[3].slide_title)
      expect(result.next_step).toBe(4)
      expect(result.marp_markdown.length).toBeGreaterThan(0)
      expect(result.presentation_guide.length).toBe(3)
    })

    it('does not call fetch in mock mode', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      const { callSlideApi } = await import('./slideApiService')

      const promise = callSlideApi(makeRequest(1))
      await vi.advanceTimersByTimeAsync(500)
      await promise

      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('has ~500ms delay in mock mode', async () => {
      const { callSlideApi } = await import('./slideApiService')

      let resolved = false
      const promise = callSlideApi(makeRequest(1)).then(() => {
        resolved = true
      })

      await vi.advanceTimersByTimeAsync(400)
      expect(resolved).toBe(false)

      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(resolved).toBe(true)
    })
  })

  describe('production mode (VITE_MOCK_MODE unset or not "true")', () => {
    it('calls fetch when VITE_MOCK_MODE is unset', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_MOCK_MODE
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            slide_title: 'test',
            slide_text: 'content',
            image_keyword: 'star',
            ai_response_voice: 'voice',
            next_step: 2,
            marp_markdown: '',
            presentation_guide: [],
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

    it('calls fetch when VITE_MOCK_MODE="false"', async () => {
      ;(import.meta.env as Record<string, unknown>).VITE_MOCK_MODE = 'false'
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            slide_title: 'test',
            slide_text: 'content',
            image_keyword: 'star',
            ai_response_voice: 'voice',
            next_step: 2,
            marp_markdown: '',
            presentation_guide: [],
          }),
      }
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockResponse as Response)

      const { callSlideApi } = await import('./slideApiService')
      await callSlideApi(makeRequest(1))

      expect(fetchSpy).toHaveBeenCalled()
    })

    it('calls fetch when VITE_MOCK_MODE=""', async () => {
      ;(import.meta.env as Record<string, unknown>).VITE_MOCK_MODE = ''
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            slide_title: 'test',
            slide_text: 'content',
            image_keyword: 'star',
            ai_response_voice: 'voice',
            next_step: 2,
            marp_markdown: '',
            presentation_guide: [],
          }),
      }
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockResponse as Response)

      const { callSlideApi } = await import('./slideApiService')
      await callSlideApi(makeRequest(1))

      expect(fetchSpy).toHaveBeenCalled()
    })

    it('throws on HTTP error', async () => {
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
