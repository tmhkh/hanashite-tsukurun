import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechSynthesis } from './useSpeechSynthesis';

// SpeechSynthesisUtterance のモック
class MockSpeechSynthesisUtterance {
  lang: string = '';
  text: string;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

// speechSynthesis のモック
const mockCancel = vi.fn();
const mockSpeak = vi.fn();

const mockSpeechSynthesis = {
  cancel: mockCancel,
  speak: mockSpeak,
};

beforeEach(() => {
  vi.clearAllMocks();

  // グローバルへモックを設定
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: MockSpeechSynthesisUtterance,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSpeechSynthesis', () => {
  it('初期状態では isSpeaking が false であること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSpeaking).toBe(false);
  });

  it('speak() 呼び出し直後に isSpeaking=true になること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('こんにちは');
    });

    expect(result.current.isSpeaking).toBe(true);
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('speak() で生成された Utterance の lang が ja-JP であること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('テスト');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.lang).toBe('ja-JP');
    expect(utterance.text).toBe('テスト');
  });

  it('onend イベント発火後に isSpeaking が false に戻ること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('テスト');
    });

    // onend イベントを手動で発火
    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    act(() => {
      utterance.onstart?.();
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      utterance.onend?.();
    });

    expect(result.current.isSpeaking).toBe(false);
  });

  it('onEnd コールバックが音声終了時に呼び出されること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    const onEnd = vi.fn();

    act(() => {
      result.current.speak('テスト', onEnd);
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    act(() => {
      utterance.onend?.();
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('onEnd コールバックなしでも正常に動作すること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('テスト');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    // onEnd なしで onend 発火しても例外が出ないこと
    expect(() => {
      act(() => {
        utterance.onend?.();
      });
    }).not.toThrow();

    expect(result.current.isSpeaking).toBe(false);
  });

  it('cancel() 呼び出し後に isSpeaking が false になること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('テスト');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    act(() => {
      utterance.onstart?.();
    });

    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isSpeaking).toBe(false);
    expect(mockCancel).toHaveBeenCalled();
  });

  it('speak() 呼び出し前に既存の音声をキャンセルすること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('最初のテキスト');
    });

    mockCancel.mockClear();

    act(() => {
      result.current.speak('次のテキスト');
    });

    // speak() の冒頭で cancel() が呼ばれる
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  it('onerror イベント発火後に isSpeaking が false になること', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('テスト');
    });

    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    act(() => {
      utterance.onstart?.();
    });

    act(() => {
      utterance.onerror?.();
    });

    expect(result.current.isSpeaking).toBe(false);
  });

  it('speak() 呼び出し直後に isSpeaking=true（フォールバックタイマーで自動復帰する）', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      result.current.speak('テスト');
    });

    // 新仕様: speak() 直後は即座に isSpeaking=true
    expect(result.current.isSpeaking).toBe(true);

    // onend を手動発火すると false に戻る
    const utterance = mockSpeak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    act(() => {
      utterance.onend?.();
    });
    expect(result.current.isSpeaking).toBe(false);
  });
});
