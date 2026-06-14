import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognizer } from './useSpeechRecognizer'

// SpeechRecognition のモック
class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false

  onresult: ((event: SpeechRecognitionEvent) => void) | null = null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null
  onend: (() => void) | null = null

  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()

  /** テスト用: 音声認識成功をシミュレート */
  simulateResult(transcript: string) {
    const event = {
      results: [
        [{ transcript, confidence: 0.9 }],
      ],
    } as unknown as SpeechRecognitionEvent
    this.onresult?.(event)
  }

  /** テスト用: 音声認識エラーをシミュレート */
  simulateError(error: string) {
    const event = { error } as unknown as SpeechRecognitionErrorEvent
    this.onerror?.(event)
  }

  /** テスト用: 認識終了をシミュレート */
  simulateEnd() {
    this.onend?.()
  }
}

let mockRecognitionInstance: MockSpeechRecognition

beforeEach(() => {
  vi.useFakeTimers()
  mockRecognitionInstance = new MockSpeechRecognition()

  // window.SpeechRecognition をモックに差し替え
  Object.defineProperty(window, 'SpeechRecognition', {
    value: vi.fn(() => mockRecognitionInstance),
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useSpeechRecognizer', () => {
  const defaultOptions = () => ({
    onResult: vi.fn(),
    onTimeout: vi.fn(),
    onError: vi.fn(),
  })

  // ──────────────────────────────────────────────
  // 初期状態
  // ──────────────────────────────────────────────
  it('初期状態では isListening=false, transcript="", error=null', () => {
    const { result } = renderHook(() =>
      useSpeechRecognizer(defaultOptions())
    )

    expect(result.current.state.isListening).toBe(false)
    expect(result.current.state.transcript).toBe('')
    expect(result.current.state.error).toBeNull()
  })

  // ──────────────────────────────────────────────
  // start() の基本動作
  // ──────────────────────────────────────────────
  it('start() を呼ぶと isListening=true になる', () => {
    const { result } = renderHook(() =>
      useSpeechRecognizer(defaultOptions())
    )

    let started = false
    act(() => {
      started = result.current.start()
    })

    expect(started).toBe(true)
    expect(result.current.state.isListening).toBe(true)
    expect(mockRecognitionInstance.start).toHaveBeenCalledOnce()
  })

  it('start() 後に音声認識が成功すると onResult が呼ばれ isListening が false に戻る', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() => useSpeechRecognizer(opts))

    act(() => {
      result.current.start()
    })

    act(() => {
      mockRecognitionInstance.simulateResult('テストの音声')
    })

    expect(result.current.state.isListening).toBe(false)
    expect(result.current.state.transcript).toBe('テストの音声')
    expect(result.current.state.error).toBeNull()
    expect(opts.onResult).toHaveBeenCalledWith('テストの音声')
  })

  // ──────────────────────────────────────────────
  // stop() の動作
  // ──────────────────────────────────────────────
  it('stop() を呼ぶと isListening が false になる', () => {
    const { result } = renderHook(() =>
      useSpeechRecognizer(defaultOptions())
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.state.isListening).toBe(true)

    act(() => {
      result.current.stop()
    })

    expect(result.current.state.isListening).toBe(false)
    expect(mockRecognitionInstance.stop).toHaveBeenCalledOnce()
  })

  // ──────────────────────────────────────────────
  // タイムアウト動作（Requirements 3.4）
  // ──────────────────────────────────────────────
  it('10秒経過するとタイムアウトし onTimeout が呼ばれる', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer({ ...opts, timeoutMs: 10000 })
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.state.isListening).toBe(true)

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.state.isListening).toBe(false)
    expect(opts.onTimeout).toHaveBeenCalledOnce()
    expect(result.current.state.error).toBe('タイムアウトしました')
  })

  it('タイムアウト前に音声認識が成功した場合はタイムアウトしない', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer({ ...opts, timeoutMs: 10000 })
    )

    act(() => {
      result.current.start()
    })

    // 5秒後に成功
    act(() => {
      vi.advanceTimersByTime(5000)
      mockRecognitionInstance.simulateResult('成功')
    })

    // さらに5秒進めてもタイムアウトしない
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(opts.onTimeout).not.toHaveBeenCalled()
    expect(opts.onResult).toHaveBeenCalledWith('成功')
  })

  // ──────────────────────────────────────────────
  // リトライカウントとエラー処理（Requirements 3.5）
  // ──────────────────────────────────────────────
  it('1回目の失敗: onError(1) が呼ばれエラーメッセージ「もう一度 話してみてね」が設定される', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer({ ...opts, maxRetries: 2 })
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      mockRecognitionInstance.simulateError('no-speech')
    })

    expect(result.current.state.isListening).toBe(false)
    expect(result.current.state.error).toBe('もう一度 話してみてね')
    expect(opts.onError).toHaveBeenCalledWith(1)
  })

  it('2回目の失敗: onError(2) が呼ばれエラーメッセージ「もう一度 話してみてね」が設定される', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer({ ...opts, maxRetries: 2 })
    )

    // 1回目の失敗
    act(() => { result.current.start() })
    act(() => { mockRecognitionInstance.simulateError('no-speech') })

    // 2回目の失敗
    act(() => { result.current.start() })
    act(() => { mockRecognitionInstance.simulateError('no-speech') })

    expect(result.current.state.error).toBe('もう一度 話してみてね')
    expect(opts.onError).toHaveBeenCalledWith(2)
  })

  it('3回目（maxRetries+1）の失敗: 固定メッセージ「うまく きけなかったよ。もう一度 はじめから」が設定される', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer({ ...opts, maxRetries: 2 })
    )

    // 3回連続失敗
    for (let i = 0; i < 3; i++) {
      act(() => { result.current.start() })
      act(() => { mockRecognitionInstance.simulateError('no-speech') })
    }

    expect(result.current.state.error).toBe('うまく きけなかったよ。もう一度 はじめから')
    expect(opts.onError).toHaveBeenCalledWith(3)
  })

  it('成功後はリトライカウントがリセットされる', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer({ ...opts, maxRetries: 2 })
    )

    // 2回失敗
    for (let i = 0; i < 2; i++) {
      act(() => { result.current.start() })
      act(() => { mockRecognitionInstance.simulateError('no-speech') })
    }

    // 成功でリセット
    act(() => { result.current.start() })
    act(() => { mockRecognitionInstance.simulateResult('成功') })

    // 再度失敗しても1回目扱い
    act(() => { result.current.start() })
    act(() => { mockRecognitionInstance.simulateError('no-speech') })

    // エラーは1回目なので「もう一度 話してみてね」
    expect(result.current.state.error).toBe('もう一度 話してみてね')
    expect(opts.onError).toHaveBeenLastCalledWith(1)
  })

  // ──────────────────────────────────────────────
  // abort によるキャンセルはエラー扱いしない
  // ──────────────────────────────────────────────
  it('abort エラーはユーザー起因の中断のためリトライカウントを増やさない', () => {
    const opts = defaultOptions()
    const { result } = renderHook(() =>
      useSpeechRecognizer(opts)
    )

    act(() => { result.current.start() })
    act(() => { mockRecognitionInstance.simulateError('aborted') })

    expect(opts.onError).not.toHaveBeenCalled()
    expect(result.current.state.isListening).toBe(false)
  })

  // ──────────────────────────────────────────────
  // デフォルトオプション
  // ──────────────────────────────────────────────
  it('lang のデフォルトは ja-JP', () => {
    const { result } = renderHook(() =>
      useSpeechRecognizer(defaultOptions())
    )

    act(() => { result.current.start() })

    expect(mockRecognitionInstance.lang).toBe('ja-JP')
  })

  it('continuous は false に設定される', () => {
    const { result } = renderHook(() =>
      useSpeechRecognizer(defaultOptions())
    )

    act(() => { result.current.start() })

    expect(mockRecognitionInstance.continuous).toBe(false)
  })

  // ──────────────────────────────────────────────
  // SpeechRecognition 非対応ブラウザ
  // ──────────────────────────────────────────────
  it('SpeechRecognition 非対応ブラウザでは start() がエラーを設定する', () => {
    // SpeechRecognition を undefined に設定
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() =>
      useSpeechRecognizer(defaultOptions())
    )

    let started = true
    act(() => {
      started = result.current.start()
    })

    expect(started).toBe(false)
    expect(result.current.state.isListening).toBe(false)
    expect(result.current.state.error).toBe('このブラウザは音声認識に対応していません')
  })
})
