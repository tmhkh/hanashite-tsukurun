import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlideApi } from './useSlideApi'
import * as slideApiService from '../services/slideApiService'
import type { SlideApiRequest, SlideApiResponse } from '../types/index'

// slideApiService をモック
vi.mock('../services/slideApiService')

// AuthContext をモック
const mockGetToken = vi.fn(() => 'mock-token')
const mockLogout = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
    idToken: 'mock-token',
    error: null,
    login: vi.fn(),
    loginWithPasskey: vi.fn(),
  }),
}))

const mockRequest: SlideApiRequest = {
  grade: 'grade1',
  current_step: 1,
  user_speech: 'いぬがすきです',
  history: [],
}

const mockResponse: SlideApiResponse = {
  slide_title: 'すきなどうぶつ',
  slide_text: 'ぼくはいぬがすきです',
  image_keyword: 'dog',
  ai_response_voice: 'いいね！どんなところがすきなの？',
  next_step: 2,
  script: '',
}

describe('useSlideApi', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetToken.mockReturnValue('mock-token')
  })

  it('初期状態は loading=false, error=null', () => {
    const { result } = renderHook(() => useSlideApi())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('API呼び出し中は loading=true になる', async () => {
    // 遅延するPromiseを作成
    let resolvePromise!: (value: SlideApiResponse) => void
    const delayedPromise = new Promise<SlideApiResponse>((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(slideApiService.callSlideApi).mockReturnValue(delayedPromise)

    const { result } = renderHook(() => useSlideApi())

    // API呼び出し開始
    let callPromise: Promise<SlideApiResponse>
    act(() => {
      callPromise = result.current.call(mockRequest)
    })

    // loading=true になっていることを確認
    expect(result.current.loading).toBe(true)

    // 完了させる
    await act(async () => {
      resolvePromise(mockResponse)
      await callPromise
    })

    expect(result.current.loading).toBe(false)
  })

  it('API成功時は loading=false に戻り、レスポンスを返す', async () => {
    vi.mocked(slideApiService.callSlideApi).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useSlideApi())

    let response: SlideApiResponse | undefined
    await act(async () => {
      response = await result.current.call(mockRequest)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(response).toEqual(mockResponse)
  })

  it('API エラー時は loading=false に戻り、error にメッセージがセットされる', async () => {
    const errorMessage = 'HTTP error: 500'
    vi.mocked(slideApiService.callSlideApi).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useSlideApi())

    await act(async () => {
      await result.current.call(mockRequest).catch(() => {})
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(errorMessage)
  })

  it('API エラー時は元のエラーを再スローする', async () => {
    const originalError = new Error('network error')
    vi.mocked(slideApiService.callSlideApi).mockRejectedValue(originalError)

    const { result } = renderHook(() => useSlideApi())

    await act(async () => {
      await expect(result.current.call(mockRequest)).rejects.toThrow('network error')
    })
  })

  it('Error インスタンス以外の例外も error に文字列でセットされる', async () => {
    vi.mocked(slideApiService.callSlideApi).mockRejectedValue('予期しないエラー')

    const { result } = renderHook(() => useSlideApi())

    await act(async () => {
      await result.current.call(mockRequest).catch(() => {})
    })

    expect(result.current.error).toBe('不明なエラーが発生しました')
  })

  it('2回目の呼び出しで前回の error がクリアされる', async () => {
    vi.mocked(slideApiService.callSlideApi).mockRejectedValueOnce(new Error('first error'))
    vi.mocked(slideApiService.callSlideApi).mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSlideApi())

    // 1回目：エラー発生
    await act(async () => {
      await result.current.call(mockRequest).catch(() => {})
    })
    expect(result.current.error).toBe('first error')

    // 2回目：成功
    await act(async () => {
      await result.current.call(mockRequest)
    })
    expect(result.current.error).toBeNull()
  })

  it('callSlideApi が正しい引数で呼ばれる（トークン付き）', async () => {
    vi.mocked(slideApiService.callSlideApi).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useSlideApi())

    await act(async () => {
      await result.current.call(mockRequest)
    })

    expect(slideApiService.callSlideApi).toHaveBeenCalledWith(mockRequest, 'mock-token')
    expect(slideApiService.callSlideApi).toHaveBeenCalledTimes(1)
  })
})
