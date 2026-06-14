import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * 音声認識の状態
 */
export interface SpeechRecognizerState {
  isListening: boolean
  transcript: string
  error: string | null
}

/**
 * useSpeechRecognizer フックのオプション
 */
export interface UseSpeechRecognizerOptions {
  /** 音声認識の言語（デフォルト: 'ja-JP'） */
  lang?: string
  /** タイムアウトまでのミリ秒（デフォルト: 10000） */
  timeoutMs?: number
  /** 最大リトライ回数（デフォルト: 2） */
  maxRetries?: number
  /** 音声認識に成功したときのコールバック */
  onResult: (text: string) => void
  /** タイムアウトしたときのコールバック */
  onTimeout: () => void
  /**
   * 音声認識に失敗したときのコールバック
   * @param retryCount 現在の失敗回数（1から始まる）
   */
  onError: (retryCount: number) => void
}

// SpeechRecognition インスタンスの型
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

/**
 * Web Speech API を用いた音声認識カスタムフック
 * Requirements: 3.2, 3.4, 3.5
 */
export function useSpeechRecognizer(options: UseSpeechRecognizerOptions): {
  state: SpeechRecognizerState
  start: () => boolean
  stop: () => void
} {
  const {
    lang = 'ja-JP',
    timeoutMs = 10000,
    maxRetries = 2,
    onResult,
    onTimeout,
    onError,
  } = options

  const [state, setState] = useState<SpeechRecognizerState>({
    isListening: false,
    transcript: '',
    error: null,
  })

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const isListeningRef = useRef(false)

  // コールバックを ref に保持して最新版を参照できるようにする
  const onResultRef = useRef(onResult)
  const onTimeoutRef = useRef(onTimeout)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onResultRef.current = onResult
    onTimeoutRef.current = onTimeout
    onErrorRef.current = onError
  }, [onResult, onTimeout, onError])

  /** タイムアウトタイマーをクリアする */
  const clearTimeoutTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  /** SpeechRecognition インスタンスを作成して設定する */
  const createRecognition = useCallback(() => {
    // ブラウザ互換: SpeechRecognition または webkitSpeechRecognition を使用
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: { new(): SpeechRecognitionInstance } }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: { new(): SpeechRecognitionInstance } }).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setState((prev) => ({
        ...prev,
        error: 'このブラウザは音声認識に対応していません',
      }))
      return null
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearTimeoutTimer()
      const text = event.results[0]?.[0]?.transcript ?? ''
      isListeningRef.current = false
      setState({
        isListening: false,
        transcript: text,
        error: null,
      })
      retryCountRef.current = 0
      onResultRef.current(text)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearTimeoutTimer()
      isListeningRef.current = false

      // ユーザーが stop() を呼んだときの中断はエラー扱いしない
      if (event.error === 'aborted') {
        setState((prev) => ({ ...prev, isListening: false }))
        return
      }

      retryCountRef.current += 1
      const currentRetry = retryCountRef.current

      if (currentRetry <= maxRetries) {
        // 1〜maxRetries 回目: 「もう一度話してみてね」
        setState({
          isListening: false,
          transcript: '',
          error: 'もう一度 話してみてね',
        })
        onErrorRef.current(currentRetry)
      } else {
        // maxRetries + 1 回目（3回目）: 固定エラーメッセージ
        setState({
          isListening: false,
          transcript: '',
          error: 'うまく きけなかったよ。もう一度 はじめから',
        })
        onErrorRef.current(currentRetry)
        retryCountRef.current = 0
      }
    }

    recognition.onend = () => {
      // タイムアウトや onresult で処理済みでない場合のフォールバック
      if (isListeningRef.current) {
        isListeningRef.current = false
        setState((prev) => ({ ...prev, isListening: false }))
      }
    }

    return recognition
  }, [lang, maxRetries, clearTimeoutTimer])

  /** 音声認識を開始する */
  const start = useCallback((): boolean => {
    // 既に認識中なら何もしない
    if (isListeningRef.current) return false

    const recognition = createRecognition()
    if (!recognition) return false

    recognitionRef.current = recognition
    isListeningRef.current = true
    setState({
      isListening: true,
      transcript: '',
      error: null,
    })

    // 10秒タイムアウトを設定
    timeoutRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        isListeningRef.current = false
        try {
          recognition.abort()
        } catch {
          // abort 失敗は無視
        }
        setState({
          isListening: false,
          transcript: '',
          error: 'タイムアウトしました',
        })
        onTimeoutRef.current()
      }
    }, timeoutMs)

    try {
      recognition.start()
      return true
    } catch {
      clearTimeoutTimer()
      isListeningRef.current = false
      setState({
        isListening: false,
        transcript: '',
        error: '音声認識の開始に失敗しました',
      })
      return false
    }
  }, [createRecognition, timeoutMs, clearTimeoutTimer])

  /** 音声認識を停止する */
  const stop = useCallback(() => {
    clearTimeoutTimer()
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false
      try {
        recognitionRef.current.stop()
      } catch {
        // stop 失敗は無視
      }
      setState((prev) => ({ ...prev, isListening: false }))
    }
  }, [clearTimeoutTimer])

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      clearTimeoutTimer()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [clearTimeoutTimer])

  return { state, start, stop }
}
